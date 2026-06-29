// BUG-8 / audit HIGH-2 (+ #3) — AC6 reproduction at the runner level.
// Drives runMigrations through the real 3.3.x→4.0.0 migration, forces a failure
// AFTER apply() (so the SKILL.md is rewritten and the state file written), and
// asserts the automatic rollback restores the rewritten skill and removes the
// migration-created state file. FAILS on pre-fix main; PASSES after the fix.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const { runMigrations } = require('../../scripts/update/lib/migration-runner');
const migration = require('../../scripts/update/migrations/3.3.x-to-4.0.0');
const validator = require('../../scripts/update/lib/validator');
const { createInstallation, silenceConsole, restoreConsole } = require('../helpers');

describe('runMigrations rollback restores the migration write-set (BUG-8 / AC6)', () => {
  let tmpDir, originalCwd, origValidate;
  const STUB = '_bmad/bmm/test-agent/SKILL.md';
  const STATE = '_bmad/_memory/migration-state-4.0.yaml';
  // Rewritable by _rewriteActivation: has "## On Activation" + the bmad-init step.
  const ORIGINAL =
    ['# Test Agent', '', '## On Activation', '',
      '1. **Load config via bmad-init skill**', '2. Greet the user', '',
      '## Other', 'body'].join('\n') + '\n';

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bug8-ac6-'));
    await createInstallation(tmpDir, '3.3.0');
    await fs.outputFile(
      path.join(tmpDir, '_bmad/_config/v6.3-migration-inventory.csv'),
      'file,module_config_path,module,agent_name,pattern_matched,candidate_status\n' +
        `${STUB},bmm,bmm,test-agent,1. **Load config via bmad-init skill**,canonical\n`
    );
    await fs.outputFile(path.join(tmpDir, STUB), ORIGINAL);
    // _phase2 skips any module lacking _bmad/<module>/config.yaml — give bmm one
    // so the stub is actually swept (otherwise the rollback assertion is vacuous).
    await fs.outputFile(path.join(tmpDir, '_bmad/bmm/config.yaml'), 'version: 3.3.0\n');
    originalCwd = process.cwd();
    origValidate = validator.validateInstallation;
  });

  after(async () => {
    validator.validateInstallation = origValidate;
    process.chdir(originalCwd);
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('restores the rewritten SKILL.md and deletes the state file on forced failure', async () => {
    process.chdir(tmpDir);
    silenceConsole();

    // Force a post-apply failure: validation runs AFTER apply() has rewritten
    // the SKILL.md (phase 3) and written the state file (phase 5).
    validator.validateInstallation = async () => ({
      valid: false,
      checks: [{ name: 'forced-failure (BUG-8 repro)', passed: false, error: 'forced' }],
    });

    try {
      await runMigrations('3.3.0');
    } catch (_e) {
      // runMigrations may re-throw after rolling back — the rollback is the SUT.
    } finally {
      validator.validateInstallation = origValidate;
      restoreConsole();
    }

    // Sanity: the migration must actually have rewritten the stub before failing
    // (otherwise the test proves nothing). The pre-migration content is unique.
    const restored = await fs.readFile(path.join(tmpDir, STUB), 'utf8');
    assert.equal(restored, ORIGINAL, 'rollback must restore the rewritten SKILL.md to pre-migration content');
    assert.equal(
      fs.existsSync(path.join(tmpDir, STATE)),
      false,
      'rollback must delete the migration-created state file (audit #3)'
    );
  });

  it('guard: the migration genuinely rewrites the stub (so the AC6 restore is meaningful, not a false pass)', async () => {
    // Independent fixture — run apply() with NO forced failure and confirm the
    // stub is actually mutated by _phase3. If this ever stops rewriting, the
    // AC6 assertion above would silently become a no-op.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bug8-rewrite-'));
    try {
      await createInstallation(dir, '3.3.0');
      await fs.outputFile(
        path.join(dir, '_bmad/_config/v6.3-migration-inventory.csv'),
        'file,module_config_path,module,agent_name,pattern_matched,candidate_status\n' +
          `${STUB},bmm,bmm,test-agent,1. **Load config via bmad-init skill**,canonical\n`
      );
      await fs.outputFile(path.join(dir, STUB), ORIGINAL);
      await fs.outputFile(path.join(dir, '_bmad/bmm/config.yaml'), 'version: 3.3.0\n');

      silenceConsole();
      await migration.apply(dir);
      restoreConsole();

      const rewritten = await fs.readFile(path.join(dir, STUB), 'utf8');
      assert.notEqual(rewritten, ORIGINAL, 'phase 3 must rewrite the stub');
      assert.ok(
        rewritten.includes('config.yaml` directly'),
        'rewrite must install the v4 direct-YAML activation block'
      );
    } finally {
      restoreConsole();
      await fs.remove(dir);
    }
  });
});
