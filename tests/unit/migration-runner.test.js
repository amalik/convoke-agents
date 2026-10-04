const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const { executeMigration, previewMigrations, MigrationError } = require('../../scripts/update/lib/migration-runner');

describe('MigrationError', () => {
  it('wraps original error with migration name', () => {
    const original = new Error('file not found');
    const err = new MigrationError('1.0.x-to-1.3.0', original);

    assert.equal(err.name, 'MigrationError');
    assert.ok(err.message.includes('1.0.x-to-1.3.0'));
    assert.ok(err.message.includes('file not found'));
    assert.equal(err.migrationName, '1.0.x-to-1.3.0');
    assert.equal(err.originalError, original);
  });

  it('is an instance of Error', () => {
    const err = new MigrationError('test', new Error('x'));
    assert.ok(err instanceof Error);
  });
});

describe('executeMigration', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-exec-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('calls apply and returns changes', async () => {
    const fakeMigration = {
      name: 'test-migration',
      module: {
        async apply(_projectRoot) {
          return ['change 1', 'change 2'];
        }
      }
    };

    const changes = await executeMigration(fakeMigration, tmpDir);
    assert.deepEqual(changes, ['change 1', 'change 2']);
  });

  it('throws when migration has no apply function', async () => {
    const badMigration = {
      name: 'bad-migration',
      module: {}
    };

    await assert.rejects(
      () => executeMigration(badMigration, tmpDir),
      /has no apply function/
    );
  });

  it('throws when migration module is null', async () => {
    const nullMigration = {
      name: 'null-migration',
      module: null
    };

    await assert.rejects(
      () => executeMigration(nullMigration, tmpDir),
      /has no apply function/
    );
  });

  it('propagates errors from apply', async () => {
    const failMigration = {
      name: 'fail-migration',
      module: {
        async apply() {
          throw new Error('disk full');
        }
      }
    };

    await assert.rejects(
      () => executeMigration(failMigration, tmpDir),
      /disk full/
    );
  });

  it('logs changes in verbose mode', async () => {
    const fakeMigration = {
      name: 'verbose-test',
      module: {
        async apply() {
          return ['did something'];
        }
      }
    };

    // Should not throw with verbose=true
    const changes = await executeMigration(fakeMigration, tmpDir, { verbose: true });
    assert.deepEqual(changes, ['did something']);
  });
});

describe('previewMigrations — the refresh plan tells the truth about the configs (T239)', () => {
  // The plan an operator reads before re-running to apply said
  // `  - Update config.yaml (preserving user preferences)`: singular, and true only for the two
  // modules whose config goes through `mergeConfig`. Nothing asserted on the string, so it stayed
  // wrong through four rounds of documentation correction.
  //
  // R1 note: the kept set is pinned against `mergedModuleNames()`, not `MODULE_PROFILES`. A profile
  // is necessary but not sufficient — only the Gyre and Vortex write sites call `mergeConfig` — and
  // asserting against the profile table let a profile added for a wholesale-copied module print a
  // false claim with every test green.
  const { guardedModuleNames, mergedModuleNames } = require('../../scripts/update/lib/refresh-installation');

  async function planText() {
    const out = [];
    const real = console.log;
    console.log = (...a) => out.push(a.join(' '));
    try {
      await previewMigrations([
        { name: 'p', description: 'd', module: { async preview() { return { actions: ['a'] }; } } },
      ]);
    } finally {
      console.log = real;
    }
    // chalk may emit colour codes depending on TTY detection; compare on the text alone. The
    // escape is built rather than written as a literal, which `no-control-regex` rejects.
    const ansi = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
    return out.join('\n').replace(ansi, '');
  }

  const keptLine = (t) => t.split('\n').find((l) => /your values are kept/.test(l));
  const replacedLine = (t) => t.split('\n').find((l) => /replaced from the package template/.test(l));

  it('names every module whose config.yaml the refresh writes', async () => {
    const text = await planText();
    for (const m of guardedModuleNames()) {
      assert.ok(text.includes(m), `the plan does not mention ${m}, whose config the refresh writes`);
    }
  });

  it('prints the number of configs it will write, derived', async () => {
    const text = await planText();
    // Hardcoding `999 modules` left every assertion green before this existed.
    assert.match(text, new RegExp(`config\\.yaml in ${guardedModuleNames().length} modules`),
      `the plan must state the count a refresh actually writes (${guardedModuleNames().length})`);
  });

  it('claims values are kept for exactly the modules that merge them', async () => {
    const text = await planText();
    const line = keptLine(text);
    assert.ok(line, 'no line claims any module keeps your values');
    // Floor: an empty list rendered a sentence that named nothing and implied the opposite.
    assert.ok(mergedModuleNames().length >= 2, 'precondition: more than one module merges its config');
    for (const m of mergedModuleNames()) {
      assert.ok(line.includes(m), `${m} goes through mergeConfig but is not named as keeping values`);
    }
    for (const m of guardedModuleNames().filter((x) => !mergedModuleNames().includes(x))) {
      assert.ok(!line.includes(m),
        `${m} is copied over wholesale, so the plan must not claim its values are kept`);
    }
  });

  it('says the wholesale-copied configs are replaced from the template', async () => {
    const text = await planText();
    const line = replacedLine(text);
    assert.ok(line, 'no line says any config is replaced from the package template');
    const replaced = guardedModuleNames().filter((m) => !mergedModuleNames().includes(m));
    assert.ok(replaced.length >= 1, 'precondition: at least one module is replaced wholesale');
    for (const m of replaced) {
      assert.ok(line.includes(m), `${m} is replaced from the template and the plan must say so`);
    }
    for (const m of mergedModuleNames()) {
      assert.ok(!line.includes(m), `${m} keeps your values, so it must not be listed as replaced`);
    }
  });

  it('tells the operator where the replaced copies are', async () => {
    const text = await planText();
    // Deleting this line left all assertions green, and it is the one an operator about to lose
    // three configs most needs. It must not credit the dry run, which takes no backup.
    const idx = text.split('\n').findIndex((l) => /replaced from the package template/.test(l));
    assert.notEqual(idx, -1, 'no replaced-from-template line to anchor on');
    const after = text.split('\n').slice(idx + 1, idx + 3).join('\n');
    assert.match(after, /backup/i, 'the replaced-config line must be followed by where the copies are');
    assert.ok(!/this run's backup/.test(text),
      'the run printing this plan is the dry run, which takes no backup');
  });

  it('no longer promises preservation for all of them', async () => {
    const text = await planText();
    assert.ok(!/Update config\.yaml \(preserving user preferences\)/.test(text),
      'the unscoped promise is back');
  });
});

describe('previewMigrations', () => {
  it('returns dryRun result with previews', async () => {
    const migrations = [
      {
        name: 'test-migration',
        description: 'Test description',
        module: {
          async preview() {
            return { actions: ['action 1', 'action 2'] };
          }
        }
      }
    ];

    const result = await previewMigrations(migrations);
    assert.equal(result.success, true);
    assert.equal(result.dryRun, true);
    assert.equal(result.previews.length, 1);
    assert.equal(result.previews[0].name, 'test-migration');
    assert.deepEqual(result.previews[0].preview.actions, ['action 1', 'action 2']);
  });

  it('handles migrations without preview', async () => {
    const migrations = [
      {
        name: 'no-preview',
        description: 'No preview available',
        module: {}
      }
    ];

    const result = await previewMigrations(migrations);
    assert.equal(result.success, true);
    assert.equal(result.previews.length, 0);
  });

  it('handles multiple migrations', async () => {
    const migrations = [
      {
        name: 'first',
        description: 'First',
        module: { async preview() { return { actions: ['a'] }; } }
      },
      {
        name: 'second',
        description: 'Second',
        module: { async preview() { return { actions: ['b'] }; } }
      }
    ];

    const result = await previewMigrations(migrations);
    assert.equal(result.previews.length, 2);
  });
});
