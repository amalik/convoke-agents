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

describe('previewMigrations — the refresh plan warns about the configs and points (T239)', () => {
  // This plan printed `  - Update config.yaml (preserving user preferences)`: singular, and true
  // for two of the five configs a refresh writes. The first fix restated the whole split here.
  // `UPDATE-GUIDE.md`'s canonical section declares itself the one statement of that fact and says
  // to make every other mention a pointer, and two review rounds found 3 HIGH and 11 MEDIUM
  // against the restatement and its pins without once finding a defect in the refresh itself. So
  // the plan now carries the warning and delegates the detail, and these tests assert only what
  // the plan still claims — the split itself is pinned where it is measured, in
  // `refresh-installation-config-guard.test.js`, and bound to the guide in
  // `config-doc-canonical.test.js`.
  const CANONICAL = 'Which configs are checked, and which are preserved';

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

  it('warns that the configs are not all treated alike', async () => {
    const text = await planText();
    assert.match(text, /- Update module config\.yaml files/,
      'the plan must still say it writes the module configs');
    assert.match(text, /not all of them keep your values/,
      'an operator consenting to this run must be told the configs differ');
  });

  it('points at the section that owns the detail', async () => {
    const text = await planText();
    assert.ok(text.includes(CANONICAL),
      `the plan must name "${CANONICAL}" rather than restating it — the guide declares that ` +
        'section canonical and a second copy is what drifted');
    // The pointer is only worth printing if the target exists.
    const guide = require('fs').readFileSync(
      require('path').join(__dirname, '..', '..', 'UPDATE-GUIDE.md'), 'utf8');
    assert.ok(guide.includes(`### ${CANONICAL}`), 'the section the plan points at is gone from the guide');
  });

  it('makes no unscoped promise of preservation', async () => {
    const text = await planText();
    assert.match(text, /- Update module config\.yaml files/, 'anchor: the config line is present');
    assert.ok(!/preserving user preferences/.test(text), 'the unscoped promise is back');
    assert.ok(!/your values are kept/.test(text),
      'the plan must not state the kept half either — that is the canonical section\'s to state');
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
