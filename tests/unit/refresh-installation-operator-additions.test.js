'use strict';

/**
 * T221: a refresh copies `_enhance`, `_artifacts` and `_portability` from the package template. It
 * used to drop every key an operator had added to their `config.yaml`, and — for `_artifacts` and
 * `_portability`, which are removed before the copy — every file the operator had added under them.
 * Operator ruling 2026-10-26: the package's own keys still win, keys the operator added are kept,
 * and so are files the package does not ship.
 *
 * Which modules keep which kind of value is measured for all five configs by the probe in
 * `refresh-installation-config-guard.test.js`; this file pins the detail of the three.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { refreshInstallation, addedKeysKeptModuleNames, carryOperatorKeys } = require('../../scripts/update/lib/refresh-installation');
const YAML = require('yaml');
const { getPackageVersion } = require('../../scripts/update/lib/utils');
const { createValidInstallation, silenceConsole, restoreConsole } = require('../helpers');

const OPTIONS = { backupGuides: false, verbose: false };

describe('T221: a refresh keeps what the operator added to the three copied modules', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t221-'));
    await createValidInstallation(tmpDir);
    silenceConsole();
    await refreshInstallation(tmpDir, OPTIONS);
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  const moduleDir = (m) => path.join(tmpDir, '_bmad', 'bme', m);
  // A file any refresh repairs: damaged before a refusal, it must still be damaged after.
  const damageSentinel = () => {
    const agentDir = path.join(tmpDir, '_bmad', 'bme', '_vortex', 'agents', 'contextualization-expert');
    const file = path.join(agentDir, fs.readdirSync(agentDir).sort().find((n) => fs.statSync(path.join(agentDir, n)).isFile()));
    fs.writeFileSync(file, 'damaged\n');
    return () => fs.readFileSync(file, 'utf8') === 'damaged\n';
  };
  const configOf = (m) => path.join(moduleDir(m), 'config.yaml');

  it('covers the modules the refresh copies from the template', () => {
    assert.deepEqual(addedKeysKeptModuleNames().sort(), ['_artifacts', '_enhance', '_portability']);
    for (const m of addedKeysKeptModuleNames()) {
      assert.ok(fs.existsSync(configOf(m)), `fixture: ${m} was not installed`);
    }
  });

  it('keeps added keys with their comments, and resets the package\'s own keys', async () => {
    for (const m of addedKeysKeptModuleNames()) {
      const text = fs.readFileSync(configOf(m), 'utf8')
        .replace(/^description: .*$/m, 'description: "operator edit"')
        .replace(/^version: .*$/m, 'version: 0.0.1');
      fs.writeFileSync(configOf(m), `${text}\n# why I set this\nmy_setting: keep-me\nmy_list:\n  - a\n  - b\n`);
    }

    const changes = await refreshInstallation(tmpDir, OPTIONS);

    for (const m of addedKeysKeptModuleNames()) {
      const after = fs.readFileSync(configOf(m), 'utf8');
      assert.match(after, /^# why I set this\nmy_setting: keep-me$/m, `${m}: the added key or its comment was lost`);
      assert.match(after, /^my_list:\n {2}- a\n {2}- b$/m, `${m}: the added list was lost`);
      assert.ok(!after.includes('operator edit'), `${m}: an edit to a package key must be reset`);
      assert.match(after, new RegExp(`^version: ${getPackageVersion().replace(/\./g, '\\.')}$`, 'm'), `${m}: not stamped`);
      assert.ok(changes.includes(`Kept your keys in _bmad/bme/${m}/config.yaml: my_setting, my_list`),
        `${m}: the run must say which keys it kept`);
    }
  });

  it('keeps files the operator added, nested or not, in every module', async () => {
    for (const m of addedKeysKeptModuleNames()) {
      fs.outputFileSync(path.join(moduleDir(m), 'my-notes.md'), `notes for ${m}\n`);
      fs.outputFileSync(path.join(moduleDir(m), 'mine', 'deep', 'script.sh'), '#!/bin/sh\n', { mode: 0o755 });
    }

    const changes = await refreshInstallation(tmpDir, OPTIONS);

    for (const m of addedKeysKeptModuleNames()) {
      assert.equal(fs.readFileSync(path.join(moduleDir(m), 'my-notes.md'), 'utf8'), `notes for ${m}\n`, `${m}: file lost`);
      const script = path.join(moduleDir(m), 'mine', 'deep', 'script.sh');
      assert.ok(fs.existsSync(script), `${m}: nested file lost`);
      if (process.platform !== 'win32') {
        assert.equal(fs.statSync(script).mode & 0o777, 0o755, `${m}: the file's mode was not kept`);
      }
    }
    // `_enhance` is copied over the top, so its files were never removed and need no report.
    for (const m of ['_artifacts', '_portability']) {
      assert.ok(changes.includes(`Kept 2 file(s) you added under _bmad/bme/${m}/`), `${m}: the run must say it kept them`);
    }
  });

  it('still replaces a file the package ships, even if the operator edited it', async () => {
    for (const m of ['_artifacts', '_portability']) {
      const shipped = fs.readdirSync(path.join(moduleDir(m), 'workflows')).sort()
        .find((d) => fs.existsSync(path.join(moduleDir(m), 'workflows', d, 'workflow.md')));
      assert.ok(shipped, `fixture: ${m} ships no workflow.md`);
      const file = path.join(moduleDir(m), 'workflows', shipped, 'workflow.md');
      const original = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(file, 'operator rewrite\n');
      await refreshInstallation(tmpDir, OPTIONS);
      assert.equal(fs.readFileSync(file, 'utf8'), original, `${m}: a shipped file must come from the package`);
    }
  });

  it('reports nothing kept when there is nothing to keep', async () => {
    const changes = await refreshInstallation(tmpDir, OPTIONS);
    assert.deepEqual(changes.filter((c) => /^Kept |^Could not put back/.test(c)), []);
  });

  it('records what it installed, files and config keys, and never treats the record as yours', async () => {
    for (const m of addedKeysKeptModuleNames()) {
      const record = JSON.parse(fs.readFileSync(path.join(moduleDir(m), '.convoke-installed.json'), 'utf8'));
      assert.deepEqual(record.keys, ['description', 'name', 'version', 'workflows'], `${m}: the package's config keys`);
      if (m === '_enhance') {
        // Copied over the top, so nothing would ever act on a file list there.
        assert.equal(record.files, undefined, '_enhance: the record must hold the keys alone');
        continue;
      }
      assert.ok(record.files.includes('config.yaml'), `${m}: the record must list what the package installed`);
      assert.ok(!record.files.includes('.convoke-installed.json'), `${m}: the record must not list itself`);
    }
    const changes = await refreshInstallation(tmpDir, OPTIONS);
    assert.deepEqual(changes.filter((c) => /^Kept \d+ file|^Removed \d+ file/.test(c)), [],
      'the record itself was reported as an added or a stale file');
  });

  it('keeps every file the package does not ship when the record is missing or damaged', async () => {
    // The first refresh after upgrading has no record, and a damaged one is no better: both must
    // fall back to keeping, since removing is the direction that loses the operator's work.
    for (const [m, damage] of [['_artifacts', 'not json'], ['_portability', null]]) {
      const recordPath = path.join(moduleDir(m), '.convoke-installed.json');
      if (damage === null) fs.removeSync(recordPath);
      else fs.writeFileSync(recordPath, damage);
      fs.outputFileSync(path.join(moduleDir(m), 'workflows', 'old', 'leftover.md'), 'unknown origin\n');
    }

    await refreshInstallation(tmpDir, OPTIONS);

    for (const m of ['_artifacts', '_portability']) {
      assert.ok(fs.existsSync(path.join(moduleDir(m), 'workflows', 'old', 'leftover.md')), `${m}: removed without a record`);
      assert.ok(Array.isArray(JSON.parse(fs.readFileSync(path.join(moduleDir(m), '.convoke-installed.json'), 'utf8')).files),
        `${m}: the record was not rewritten`);
    }
  });

  it('puts the operator\'s files back even when the copy fails after the tree was removed', async () => {
    // An install takes no backup, so between removing the tree and copying the package these files
    // existed only in memory; a failure there used to lose them for good.
    fs.outputFileSync(path.join(moduleDir('_artifacts'), 'mine', 'notes.md'), 'mine\n');
    fs.appendFileSync(configOf('_artifacts'), '\nmy_setting: keep-me\n');
    const original = fs.copy;
    fs.copy = async (src, dest, opts) => {
      if (dest === moduleDir('_artifacts')) throw Object.assign(new Error('no space left on device'), { code: 'ENOSPC' });
      return original.call(fs, src, dest, opts);
    };
    try {
      await assert.rejects(refreshInstallation(tmpDir, OPTIONS), /no space left/);
    } finally {
      fs.copy = original;
    }
    assert.equal(fs.readFileSync(path.join(moduleDir('_artifacts'), 'mine', 'notes.md'), 'utf8'), 'mine\n');
    assert.match(fs.readFileSync(configOf('_artifacts'), 'utf8'), /^my_setting: keep-me$/m,
      'the operator\'s config, and the key they added, must be put back too');
  });

  it('keeps the files and says so when the record cannot be written', async () => {
    fs.outputFileSync(path.join(moduleDir('_portability'), 'mine.md'), 'mine\n');
    const original = fs.writeFileSync;
    fs.writeFileSync = (file, ...rest) => {
      if (String(file).endsWith(path.join('_portability', '.convoke-installed.json'))) {
        throw Object.assign(new Error('i/o error'), { code: 'EIO' });
      }
      return original.call(fs, file, ...rest);
    };
    let changes;
    try {
      changes = await refreshInstallation(tmpDir, OPTIONS);
    } finally {
      fs.writeFileSync = original;
    }
    assert.ok(fs.existsSync(path.join(moduleDir('_portability'), 'mine.md')), 'the file was lost');
    assert.ok(changes.some((c) => c.startsWith('Could not record what was installed in _bmad/bme/_portability/ (EIO)')));
  });

  it('refuses, before refreshing anything, a file it could not put back where the package now ships a folder', async () => {
    // Put back, it would replace the package's folder; dropped, it is lost on an install, which
    // takes no backup. The Round 3 audit measured the second.
    const rel = 'workflows/bmad-portfolio-status/steps';
    fs.removeSync(path.join(moduleDir('_artifacts'), rel));
    fs.writeFileSync(path.join(moduleDir('_artifacts'), rel), 'unique operator content\n');
    const untouched = damageSentinel();
    await assert.rejects(refreshInstallation(tmpDir, OPTIONS),
      /cannot keep _bmad\/bme\/_artifacts\/workflows\/bmad-portfolio-status\/steps, a file you added, where the package now ships a folder/);
    assert.ok(untouched(), 'a module was refreshed before the refusal');
    assert.equal(fs.readFileSync(path.join(moduleDir('_artifacts'), rel), 'utf8'), 'unique operator content\n');
  });

  it('refuses a file of the operator\'s at a path the package newly ships, when the record shows it is new', async () => {
    const m = '_portability';
    const recordPath = path.join(moduleDir(m), '.convoke-installed.json');
    const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    // As if the package began shipping this file in this release: absent from what it installed last time.
    const rel = record.files.find((p) => p.endsWith('workflow.md'));
    record.files = record.files.filter((p) => p !== rel);
    fs.writeFileSync(recordPath, JSON.stringify(record));
    fs.writeFileSync(path.join(moduleDir(m), rel), 'the operator\'s own file\n');
    await assert.rejects(refreshInstallation(tmpDir, OPTIONS), /a file you added, where the package now ships one of its own/);
    assert.equal(fs.readFileSync(path.join(moduleDir(m), rel), 'utf8'), 'the operator\'s own file\n');
  });

  it('refuses, before refreshing anything, when _bmad/bme itself cannot have entries removed', { skip: process.platform === 'win32' || (process.getuid && process.getuid() === 0) ? 'needs POSIX permissions as a non-root user' : false }, async () => {
    const bme = path.join(tmpDir, '_bmad', 'bme');
    const untouched = damageSentinel();
    fs.chmodSync(bme, 0o555);
    try {
      await assert.rejects(refreshInstallation(tmpDir, OPTIONS), /cannot remove entries from _bmad\/bme\/ \(EACCES\)/);
    } finally {
      fs.chmodSync(bme, 0o755);
    }
    assert.ok(untouched(), 'a module was refreshed before the refusal');
  });

  it('reads a record whose entries are not all strings as naming only the strings', async () => {
    const recordPath = path.join(moduleDir('_artifacts'), '.convoke-installed.json');
    const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    record.files.push(42, null);
    record.keys.push({});
    fs.writeFileSync(recordPath, JSON.stringify(record));
    fs.ensureDirSync(path.join(moduleDir('_artifacts'), 'my-dir'));
    await refreshInstallation(tmpDir, OPTIONS);
    assert.ok(fs.existsSync(path.join(moduleDir('_artifacts'), 'my-dir')));
  });

  it('prints what it could not put back when the refresh is failing, and does not miscount a link still there', { skip: process.platform === 'win32' ? 'symlinks' : false }, async () => {
    // The refresh is about to throw, so the change list never reaches the caller: these lines must
    // be printed. A failure before the tree is removed leaves the operator's link in place.
    fs.symlinkSync('config.yaml', path.join(moduleDir('_artifacts'), 'my-link.yaml'));
    fs.writeFileSync(path.join(moduleDir('_artifacts'), 'blocked.md'), 'mine\n');
    const originalRemove = fs.remove;
    const originalWrite = fs.writeFileSync;
    fs.remove = async (p) => {
      if (p === moduleDir('_artifacts')) throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
      return originalRemove.call(fs, p);
    };
    fs.writeFileSync = (file, ...rest) => {
      if (String(file).endsWith('blocked.md')) throw Object.assign(new Error('i/o error'), { code: 'EIO' });
      return originalWrite.call(fs, file, ...rest);
    };
    const printed = [];
    const originalError = console.error;
    console.error = (...args) => printed.push(args.join(' '));
    try {
      await assert.rejects(refreshInstallation(tmpDir, OPTIONS), /permission denied/);
    } finally {
      fs.remove = originalRemove;
      fs.writeFileSync = originalWrite;
      console.error = originalError;
    }
    const line = printed.find((p) => p.includes('Could not put back'));
    assert.ok(line, `nothing was printed:\n${printed.join('\n')}`);
    assert.match(line, /Could not put back 1 entry you added under _bmad\/bme\/_artifacts\/: blocked\.md/);
  });

  it('tells the operator when a key of theirs is now set by the package', async () => {
    const m = '_enhance';
    const recordPath = path.join(moduleDir(m), '.convoke-installed.json');
    const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    // As if `description` were new in this release: the record says the package did not set it before.
    record.keys = record.keys.filter((k) => k !== 'description');
    fs.writeFileSync(recordPath, JSON.stringify(record));
    fs.writeFileSync(configOf(m), fs.readFileSync(configOf(m), 'utf8').replace(/^description: .*$/m, 'description: "mine"'));
    const changes = await refreshInstallation(tmpDir, OPTIONS);
    assert.ok(changes.includes(`The package now sets description in _bmad/bme/${m}/config.yaml; your value was replaced`));
  });

  it('keeps the comment of a config that holds nothing but a comment', async () => {
    fs.writeFileSync(configOf('_artifacts'), '# operator note only\n');
    await refreshInstallation(tmpDir, OPTIONS);
    assert.match(fs.readFileSync(configOf('_artifacts'), 'utf8'), /# operator note only/);
  });

  it('keeps the modification time of the files it puts back', async () => {
    const file = path.join(moduleDir('_artifacts'), 'dated.md');
    fs.writeFileSync(file, 'mine\n');
    const when = new Date('2020-01-02T03:04:05Z');
    fs.utimesSync(file, when, when);
    await refreshInstallation(tmpDir, OPTIONS);
    assert.equal(fs.statSync(file).mtime.getTime(), when.getTime());
  });

  it('refuses, before writing anything, a tree holding an added file it cannot read', { skip: process.platform === 'win32' || (process.getuid && process.getuid() === 0) ? 'needs POSIX permissions as a non-root user' : false }, async () => {
    const secret = path.join(moduleDir('_artifacts'), 'secret.md');
    fs.writeFileSync(secret, 'mine\n');
    fs.chmodSync(secret, 0o000);
    // A sentinel the refresh would change: a shipped Vortex agent file, damaged. Refreshed before
    // the refusal, it would come back repaired. (`_vortex/config.yaml` gets the same bytes on every
    // refresh, so it cannot tell a late refusal from an early one.)
    const agentDir = path.join(tmpDir, '_bmad', 'bme', '_vortex', 'agents', 'contextualization-expert');
    const sentinel = path.join(agentDir, fs.readdirSync(agentDir).sort().find((f) => fs.statSync(path.join(agentDir, f)).isFile()));
    fs.writeFileSync(sentinel, 'damaged\n');
    try {
      await assert.rejects(refreshInstallation(tmpDir, OPTIONS), /cannot read _bmad\/bme\/_artifacts\/secret\.md, a file you added \(EACCES\)\. .*No module has been refreshed/);
      assert.equal(fs.readFileSync(sentinel, 'utf8'), 'damaged\n', 'a module was refreshed before the refusal');
    } finally {
      fs.chmodSync(secret, 0o644);
    }
    assert.ok(fs.existsSync(secret));
  });

  it('keeps symbolic links, empty directories and directory modes the operator made', { skip: process.platform === 'win32' ? 'symlinks and modes' : false }, async () => {
    const dir = moduleDir('_portability');
    fs.symlinkSync('../config.yaml', path.join(dir, 'my-link.yaml'));
    fs.ensureDirSync(path.join(dir, 'empty-dir'));
    fs.outputFileSync(path.join(dir, 'private', 'key.txt'), 'secret\n');
    fs.chmodSync(path.join(dir, 'private', 'key.txt'), 0o600);
    fs.chmodSync(path.join(dir, 'private'), 0o700);

    await refreshInstallation(tmpDir, OPTIONS);

    assert.equal(fs.readlinkSync(path.join(dir, 'my-link.yaml')), '../config.yaml', 'the link was not kept as a link');
    assert.ok(fs.statSync(path.join(dir, 'empty-dir')).isDirectory(), 'the empty directory was lost');
    assert.equal(fs.statSync(path.join(dir, 'private')).mode & 0o777, 0o700, 'a private directory came back readable');
    assert.equal(fs.statSync(path.join(dir, 'private', 'key.txt')).mode & 0o777, 0o600, 'the file mode was not kept');
  });

  it('drops a key an earlier version set and no longer does, and keeps one the record does not name', async () => {
    const m = '_enhance';
    const recordPath = path.join(moduleDir(m), '.convoke-installed.json');
    const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    record.keys.push('legacy_setting');
    fs.writeFileSync(recordPath, JSON.stringify(record));
    fs.appendFileSync(configOf(m), '\nlegacy_setting: old\nmine: keep\n');

    const changes = await refreshInstallation(tmpDir, OPTIONS);

    const after = fs.readFileSync(configOf(m), 'utf8');
    assert.ok(!after.includes('legacy_setting'), 'a key the package retired was carried as the operator\'s');
    assert.match(after, /^mine: keep$/m);
    assert.ok(changes.includes(`Removed key(s) an earlier Convoke version set in _bmad/bme/${m}/config.yaml and no longer does: legacy_setting`));
  });

  it('refuses, before refreshing anything, a tree holding a directory it cannot remove entries from', { skip: process.platform === 'win32' || (process.getuid && process.getuid() === 0) ? 'needs POSIX permissions as a non-root user' : false }, async () => {
    const locked = path.join(moduleDir('_artifacts'), 'locked');
    fs.outputFileSync(path.join(locked, 'f.md'), 'mine\n');
    const untouched = damageSentinel();
    fs.chmodSync(locked, 0o555);
    try {
      await assert.rejects(refreshInstallation(tmpDir, OPTIONS), /cannot remove entries from _bmad\/bme\/_artifacts\/locked\/ \(EACCES\)/);
      assert.ok(fs.existsSync(configOf('_artifacts')), 'the refusal came after the tree was taken apart');
      assert.ok(untouched(), 'a module was refreshed before the refusal');
    } finally {
      fs.chmodSync(locked, 0o755);
    }
  });

  it('does not bring back, as yours, a directory only an earlier version\'s files were in', async () => {
    const m = '_artifacts';
    const recordPath = path.join(moduleDir(m), '.convoke-installed.json');
    const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    record.files.push('workflows/retired-wf/steps/s1.md');
    fs.writeFileSync(recordPath, JSON.stringify(record));
    fs.outputFileSync(path.join(moduleDir(m), 'workflows', 'retired-wf', 'steps', 's1.md'), 'old\n');
    fs.ensureDirSync(path.join(moduleDir(m), 'my-empty'));

    await refreshInstallation(tmpDir, OPTIONS);

    assert.ok(!fs.existsSync(path.join(moduleDir(m), 'workflows', 'retired-wf')), 'the retired directory came back');
    assert.ok(fs.existsSync(path.join(moduleDir(m), 'my-empty')), 'an empty directory of the operator\'s was lost');
  });

  it('treats a symbolic link at a path the package ships as the package\'s, not as yours', { skip: process.platform === 'win32' ? 'symlinks' : false }, async () => {
    const file = path.join(moduleDir('_artifacts'), 'workflows', 'bmad-migrate-artifacts', 'workflow.md');
    const original = fs.readFileSync(file, 'utf8');
    fs.removeSync(file);
    fs.symlinkSync('../../config.yaml', file);
    const changes = await refreshInstallation(tmpDir, OPTIONS);
    assert.equal(fs.readFileSync(file, 'utf8'), original);
    assert.ok(!changes.some((c) => c.startsWith('Could not put back')), 'the package\'s own path was reported as the operator\'s');
  });

  it('replaces a module whose root is a symbolic link as before, without copying through it', { skip: process.platform === 'win32' ? 'symlinks' : false }, async () => {
    const elsewhere = path.join(tmpDir, 'elsewhere');
    fs.moveSync(moduleDir('_portability'), elsewhere);
    fs.writeFileSync(path.join(elsewhere, 'mine.md'), 'mine\n');
    fs.symlinkSync(elsewhere, moduleDir('_portability'));

    await refreshInstallation(tmpDir, OPTIONS);

    assert.ok(fs.lstatSync(moduleDir('_portability')).isDirectory(), 'the module is a real directory again');
    assert.ok(fs.existsSync(path.join(elsewhere, 'mine.md')), 'what the link pointed at must be untouched');
    assert.ok(!fs.existsSync(path.join(moduleDir('_portability'), 'mine.md')), 'a second copy was written through the link');
  });

  it('removes an outdated record when a new one cannot be written', async () => {
    const recordPath = path.join(moduleDir('_enhance'), '.convoke-installed.json');
    assert.ok(fs.existsSync(recordPath), 'fixture: the first refresh wrote a record');
    const original = fs.writeFileSync;
    fs.writeFileSync = (file, ...rest) => {
      if (String(file) === recordPath) throw Object.assign(new Error('i/o error'), { code: 'EIO' });
      return original.call(fs, file, ...rest);
    };
    try {
      await refreshInstallation(tmpDir, OPTIONS);
    } finally {
      fs.writeFileSync = original;
    }
    assert.ok(!fs.existsSync(recordPath), 'an outdated record would steer the next refresh');
  });

  it('keeps a comment the operator added at the end of their config, even with no key added', async () => {
    fs.appendFileSync(configOf('_portability'), '\n# only a note\n');
    await refreshInstallation(tmpDir, OPTIONS);
    await refreshInstallation(tmpDir, OPTIONS);
    const after = fs.readFileSync(configOf('_portability'), 'utf8');
    assert.equal(after.split('# only a note').length - 1, 1, 'the comment was lost or repeated');
  });

  it('keeps the comment at the end of the operator\'s config', async () => {
    fs.appendFileSync(configOf('_artifacts'), '\nmine: keep\n\n# closing note from the operator\n');
    await refreshInstallation(tmpDir, OPTIONS);
    assert.match(fs.readFileSync(configOf('_artifacts'), 'utf8'), /# closing note from the operator/);
  });

  it('keeps an added key whose value is an alias to a package key, as its plain value', async () => {
    // The anchor sits on a package key that is not carried over, so the alias cannot travel as is.
    const m = '_artifacts';
    const text = fs.readFileSync(configOf(m), 'utf8').replace(/^description: (.*)$/m, 'description: &d $1');
    fs.writeFileSync(configOf(m), `${text}\nmy_copy: *d\n`);

    await refreshInstallation(tmpDir, OPTIONS);

    const after = fs.readFileSync(configOf(m), 'utf8');
    assert.match(after, /^my_copy: /m, 'the added key was lost');
    assert.ok(!after.includes('*d'), 'a dangling alias was written');
  });
});

describe('T221: carryOperatorKeys, against templates no shipped module has yet', () => {
  it('carries only the operator\'s part of a trailing comment when the template has one too', () => {
    const template = 'name: x\nversion: 1\n\n# template trailer\n';
    // What the operator's file holds after an earlier refresh: the template's trailer, then theirs.
    const prior = 'name: x\nversion: 1\nmine: keep\n\n# template trailer\n# operator note\n';
    for (let run = 0; run < 3; run++) {
      const doc = YAML.parseDocument(template);
      carryOperatorKeys(doc, prior, null);
      const out = doc.toString();
      assert.equal(out.split('# template trailer').length - 1, 1, `run ${run}: the template trailer was repeated`);
      assert.equal(out.split('# operator note').length - 1, 1, `run ${run}: the operator note was lost or repeated`);
    }
  });
});
