'use strict';

/**
 * T256: the `user-interview` report holds notes about named people. It was written to
 * `_bmad-output/vortex-artifacts/`, which git tracks in an operator's project — the installer wrote
 * no ignore rule anywhere. Operator ruling 2026-10-29: personal-data reports go to
 * `_bmad-output/private/`, and every install makes that folder ignore its own contents with a
 * `.gitignore` of `*` there, leaving the operator's own `.gitignore` untouched.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { execFileSync } = require('child_process');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const { createValidInstallation, silenceConsole, restoreConsole, PACKAGE_ROOT } = require('../helpers');

const OPTIONS = { backupGuides: false, verbose: false };
const PRIVATE_REL = '_bmad-output/private';

describe('T256: personal-data reports go to a folder git ignores', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t256-'));
    await createValidInstallation(tmpDir);
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('an install creates the private folder with an ignore-everything rule', async () => {
    const changes = await refreshInstallation(tmpDir, OPTIONS);
    const rule = path.join(tmpDir, PRIVATE_REL, '.gitignore');
    assert.ok(fs.existsSync(rule), 'no .gitignore in the private folder');
    const lines = fs.readFileSync(rule, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    // Everything but the rule itself, which must be committable (operator ruling D1): a rule that
    // ignored itself was never committed, so a clone had no protection.
    assert.deepEqual(lines, ['*', '!.gitignore']);
    assert.ok(changes.some((c) => c.includes(PRIVATE_REL)), 'the run must say it created the folder');
  });

  // Isolated from the machine's own git configuration: a global excludes file could otherwise make
  // a report look ignored whatever the seeded rule said.
  const GIT_ENV = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const git = (args, cwd) => execFileSync('git', args, { cwd, env: GIT_ENV, encoding: 'utf8' });

  it('git ignores a report written there, without the project\'s own .gitignore', async () => {
    await refreshInstallation(tmpDir, OPTIONS);
    git(['init', '-q'], tmpDir);
    const report = path.join(PRIVATE_REL, 'user-interview-pricing-2026-10-29.md');
    fs.writeFileSync(path.join(tmpDir, report), 'notes about a named person\n');
    assert.ok(!fs.existsSync(path.join(tmpDir, '.gitignore')), 'fixture: the project has no .gitignore of its own');
    // `check-ignore` exits 0 when the path is ignored and 1 when it is not.
    git(['check-ignore', '-q', report], tmpDir);
    const status = git(['status', '--porcelain', '--untracked-files=all'], tmpDir);
    assert.ok(!status.includes('user-interview-'), `git would offer the report for commit:\n${status}`);
    assert.ok(status.includes('_bmad-output/private/.gitignore'), 'the rule itself must be committable');
  });

  it('a clone of the project keeps reports out of git, without an install of its own', async () => {
    await refreshInstallation(tmpDir, OPTIONS);
    const origin = path.join(tmpDir, 'origin');
    fs.ensureDirSync(origin);
    fs.copySync(path.join(tmpDir, PRIVATE_REL), path.join(origin, PRIVATE_REL));
    git(['init', '-q'], origin);
    git(['add', '-A'], origin);
    git(['commit', '-q', '-m', 'project with the rule committed'], origin);
    const clone = path.join(tmpDir, 'clone');
    git(['clone', '-q', origin, clone], tmpDir);
    const report = path.join(PRIVATE_REL, 'user-interview-clone-2026-10-29.md');
    fs.writeFileSync(path.join(clone, report), 'notes about a real person\n');
    git(['check-ignore', '-q', report], clone);
  });

  // A regression guard: this passes before T256 too, since nothing wrote there then.
  it('leaves an operator\'s own .gitignore in the private folder alone', async () => {
    const rule = path.join(tmpDir, PRIVATE_REL, '.gitignore');
    await fs.outputFile(rule, '# mine\n*\n!keep-me.md\n');
    await refreshInstallation(tmpDir, OPTIONS);
    assert.equal(fs.readFileSync(rule, 'utf8'), '# mine\n*\n!keep-me.md\n');
  });

  it('warns, and leaves it, when the operator\'s rule there no longer ignores everything', async () => {
    const rule = path.join(tmpDir, PRIVATE_REL, '.gitignore');
    await fs.outputFile(rule, '# emptied by hand\n');
    const warnings = [];
    console.warn = (...args) => warnings.push(args.join(' '));
    await refreshInstallation(tmpDir, OPTIONS);
    assert.equal(fs.readFileSync(rule, 'utf8'), '# emptied by hand\n');
    assert.ok(warnings.some((w) => w.includes('does not keep the reports there out of git')), `no warning:\n${warnings.join('\n')}`);
  });
});

describe('T256: the shipped text sends the report to the private folder', () => {
  const read = (rel) => fs.readFileSync(path.join(PACKAGE_ROOT, rel), 'utf8');

  it('every file of the workflow sends the report to _bmad-output/private/, none to output_folder', () => {
    const dir = '_bmad/bme/_vortex/workflows/user-interview';
    const files = ['workflow.md', 'validate.md', 'user-interview.template.md',
      ...fs.readdirSync(path.join(PACKAGE_ROOT, dir, 'steps')).map((n) => `steps/${n}`)];
    for (const rel of files) {
      const text = read(`${dir}/${rel}`);
      assert.ok(!/\{output_folder\}\/user-interview-/.test(text), `${rel} writes the report into output_folder`);
      assert.ok(!/(save|saved|lands?) in `\{output_folder\}`/i.test(text), `${rel} says the report is saved in output_folder`);
    }
    for (const rel of ['workflow.md', 'steps/step-06-synthesize.md']) {
      assert.match(read(`${dir}/${rel}`), /_bmad-output\/private\/user-interview-\{topic\}-\{date\}\.md/, `${rel} names the private path`);
    }
  });

  it('Isla\'s guide and Mila\'s example paths agree with it', () => {
    assert.match(read('_bmad/bme/_vortex/guides/ISLA-USER-GUIDE.md'), /_bmad-output\/private\/user-interview-\{topic\}-\{date\}\.md/);
    assert.ok(!/\{output_folder\}\/user-interview-/.test(read('_bmad/bme/_vortex/guides/ISLA-USER-GUIDE.md')), 'the guide still names output_folder');
    for (const step of ['research-convergence/steps/step-01-setup.md', 'pattern-mapping/steps/step-01-setup.md']) {
      const text = read(`_bmad/bme/_vortex/workflows/${step}`);
      assert.ok(!/vortex-artifacts\/(hc1-interview-synthesis|user-interview-)/.test(text), `${step} still points interviews at vortex-artifacts`);
      assert.ok(text.includes('_bmad-output/private/user-interview-'), `${step} does not show the private path`);
    }
  });
});

describe('T256: tools that scan _bmad-output/ leave the private folder alone', () => {
  it('a portfolio scan does not see a report in it', async () => {
    const { generatePortfolio } = require('../../scripts/lib/portfolio/portfolio-engine');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-t256-port-'));
    try {
      await createValidInstallation(dir);
      silenceConsole();
      let out;
      try {
        await refreshInstallation(dir, OPTIONS); // seeds the taxonomy the scan reads
        fs.outputFileSync(path.join(dir, PRIVATE_REL, 'user-interview-secret-topic-2026-10-30.md'), '# notes\n');
        fs.outputFileSync(path.join(dir, '_bmad-output/planning-artifacts/convoke-note-visible.md'), '# visible\n');
        out = JSON.stringify(await generatePortfolio(dir));
      } finally {
        restoreConsole();
      }
      assert.ok(out.includes('convoke-note-visible'), 'fixture: the scan saw the ordinary artifact');
      assert.ok(!out.includes('secret-topic'), 'the scan indexed a private report');
    } finally {
      fs.removeSync(dir);
    }
  });

  it('migrate-artifacts refuses an --include of it, in any case, rather than scanning other folders', () => {
    const { parseArgs } = require('../../scripts/migrate-artifacts');
    silenceConsole();
    try {
      const alone = parseArgs(['--include', 'private']);
      assert.ok(alone.includeError, 'asking for private alone must be an error, not the default folders');
      const mixed = parseArgs(['--include', 'Private,vortex-artifacts']);
      assert.deepEqual(mixed.includeDirs, ['vortex-artifacts'], 'Private got past the guard');
      assert.equal(mixed.includeError, null);
    } finally {
      restoreConsole();
    }
  });
});

describe('T256: convoke-doctor warns about the private reports folder', () => {
  const { checkPrivateReports } = require('../../scripts/convoke-doctor');
  const { getPackageVersion } = require('../../scripts/update/lib/utils');
  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const git = (args) => execFileSync('git', args, { cwd: dir, env, encoding: 'utf8' });
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-t256-doc-'));
    // The check runs only where the user-interview workflow is installed.
    fs.ensureDirSync(path.join(dir, '_bmad/bme/_vortex/workflows/user-interview'));
  });
  afterEach(() => fs.removeSync(dir));

  it('says nothing for a project without the user-interview workflow', () => {
    fs.removeSync(path.join(dir, '_bmad/bme/_vortex'));
    assert.deepEqual(checkPrivateReports(dir), []);
  });

  it('asks git, so a rule a later ! line undoes is caught and an ignore-all written /* is accepted', () => {
    git(['init', '-q']);
    const rule = path.join(dir, PRIVATE_REL, '.gitignore');
    fs.outputFileSync(rule, '*\n!user-interview-*\n');
    assert.equal(checkPrivateReports(dir)[0].passed, false, 'a rule that lets reports through was passed');
    fs.outputFileSync(rule, '/*\n!.gitignore\n');
    assert.equal(checkPrivateReports(dir)[0].passed, true, 'a rule that protects was rejected');
    // Where git and the text test part: a negation that matches no report. The text test, which
    // cannot evaluate patterns, refuses any later ! line; git knows the reports are still ignored.
    fs.outputFileSync(rule, '*\n!README-keep.md\n');
    assert.equal(checkPrivateReports(dir)[0].passed, true, 'git was not asked: a harmless negation was refused');
  });

  it('pins the install it suggests for a missing rule, and gives an edit for a weak one', () => {
    const [missing] = checkPrivateReports(dir);
    assert.equal(missing.fix, `Run: npx -p convoke-agents@${getPackageVersion()} convoke-install-vortex`);
    fs.outputFileSync(path.join(dir, PRIVATE_REL, '.gitignore'), '# nothing\n');
    const [weak] = checkPrivateReports(dir);
    assert.match(weak.fix, /^Edit _bmad-output\/private\/\.gitignore/, 'an install leaves an existing rule alone, so it cannot be the fix');
  });

  it('warns when git already tracks a report inside the private folder', () => {
    git(['init', '-q']);
    fs.outputFileSync(path.join(dir, PRIVATE_REL, 'user-interview-forced-2026-01-01.md'), 'x\n');
    git(['add', '-A']);
    git(['commit', '-q', '-m', 'committed before the rule existed']);
    fs.outputFileSync(path.join(dir, PRIVATE_REL, '.gitignore'), '*\n!.gitignore\n');
    const warning = checkPrivateReports(dir).find((c) => c.name === 'Interview reports in git');
    assert.ok(warning && /1 file\(s\) in _bmad-output\/private\//.test(warning.error), JSON.stringify(checkPrivateReports(dir)));
  });

  it('passes when the rule ignores everything', () => {
    fs.outputFileSync(path.join(dir, PRIVATE_REL, '.gitignore'), '*\n!.gitignore\n');
    const [rule] = checkPrivateReports(dir);
    assert.equal(rule.passed, true);
  });

  it('warns, softly, when the rule is missing or does not ignore everything', () => {
    for (const text of [null, '# nothing\n']) {
      if (text !== null) fs.outputFileSync(path.join(dir, PRIVATE_REL, '.gitignore'), text);
      const [rule] = checkPrivateReports(dir);
      assert.equal(rule.passed, false, String(text));
      assert.equal(rule.softWarning, true, 'a privacy warning must not fail the doctor run');
    }
  });

  it('warns, by count and folder, when git still tracks interview reports from before T256', () => {
    git(['init', '-q']);
    fs.outputFileSync(path.join(dir, '_bmad-output/vortex-artifacts/user-interview-old-2026-01-01.md'), 'old\n');
    fs.outputFileSync(path.join(dir, '_bmad-output/vortex-artifacts/sub/user-interview-nested-2026-01-02.md'), 'old\n');
    git(['add', '-A']);
    git(['commit', '-q', '-m', 'old']);
    const warning = checkPrivateReports(dir).find((c) => c.name === 'Interview reports in git' && c.error.includes('before T256'));
    assert.ok(warning && warning.softWarning, 'the tracked old reports were not reported');
    assert.match(warning.error, /2 interview report\(s\)/, 'a report in a subfolder was missed');
    assert.ok(!warning.error.includes('old-2026'), 'a report name — its interview topic — was printed');
  });
});

describe('T256: what the operator is told', () => {
  it('the update plan lists the file a refresh may create', () => {
    const { printRefreshPlan } = require('../../scripts/update/lib/migration-runner');
    const lines = [];
    const original = console.log;
    console.log = (...args) => lines.push(args.join(' '));
    try {
      printRefreshPlan();
    } finally {
      console.log = original;
    }
    assert.ok(lines.some((l) => l.includes('_bmad-output/private/.gitignore')), lines.join('\n'));
  });

  it('the workflow checks with git before saving, and offers the project\'s own installer', () => {
    const wf = fs.readFileSync(path.join(PACKAGE_ROOT, '_bmad/bme/_vortex/workflows/user-interview/workflow.md'), 'utf8');
    assert.match(wf, /git check-ignore -q _bmad-output\/private\/user-interview-/);
    assert.match(wf, /offer `npx convoke-install-vortex`/);
    assert.match(wf, /run it only if they agree/);
  });
});

describe('T256: the text test used outside git', () => {
  const { ignoresEverything } = require('../../scripts/update/lib/refresh-installation');
  it('accepts an ignore-all with only !.gitignore after it, and nothing that lets reports back in', () => {
    for (const ok of ['*\n', '*\n!.gitignore\n', '/*\n!/.gitignore\n', '# c\n**\n', '*  \r\n']) assert.equal(ignoresEverything(ok), true, JSON.stringify(ok));
    for (const bad of ['', '# only a comment\n', '*\n!user-interview-*\n', '*\n!*\n', ' *\n', '*.md\n']) assert.equal(ignoresEverything(bad), false, JSON.stringify(bad));
  });
});
