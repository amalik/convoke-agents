'use strict';

/**
 * Load-test for the I97 migration tooling foundation (Story i97-1.1, AC8).
 *
 * Verifies:
 *   1. Every module under `scripts/migration/format-conversion/` requires
 *      cleanly (no SyntaxError, no MODULE_NOT_FOUND, no module-level
 *      throws).
 *   2. The documented `module.exports` shape matches what downstream
 *      stories (Story 2.1+, Story 3.x, Story 4.2) will consume.
 *   3. `scripts/audit/reference-integrity.js` exposes a callable CLI entry
 *      point (`--help` exits 0).
 *
 * This test is the no-regression contract for AC8 — if any future change
 * breaks the public API or introduces a load-time error, this test fails
 * before downstream stories notice.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

describe('i97-1.1 — Migration Tooling Foundation Scaffolded — load-test (AC8)', () => {
  describe('scripts/migration/format-conversion/fixtures/tmpDir-setup.js', () => {
    it('imports cleanly and exports { setupTmpDir, withTmpDir }', () => {
      const mod = require('../../scripts/migration/format-conversion/fixtures/tmpDir-setup');
      assert.equal(typeof mod.setupTmpDir, 'function', 'setupTmpDir must be a function');
      assert.equal(typeof mod.withTmpDir, 'function', 'withTmpDir must be a function');
    });

    it('setupTmpDir() returns { tmpDir, cleanup } and cleanup is callable', () => {
      const { setupTmpDir } = require('../../scripts/migration/format-conversion/fixtures/tmpDir-setup');
      const { tmpDir, cleanup } = setupTmpDir();
      try {
        assert.equal(typeof tmpDir, 'string');
        assert.ok(tmpDir.length > 0, 'tmpDir must be a non-empty path');
        assert.equal(typeof cleanup, 'function');
      } finally {
        cleanup();
      }
    });
  });

  describe('scripts/migration/format-conversion/fixtures/isolated-install.js', () => {
    it('imports cleanly and exports { setupIsolatedInstall }', () => {
      const mod = require('../../scripts/migration/format-conversion/fixtures/isolated-install');
      assert.equal(typeof mod.setupIsolatedInstall, 'function', 'setupIsolatedInstall must be a function');
    });
  });

  describe('scripts/migration/format-conversion/parity-harness.js', () => {
    it('imports cleanly and exports { runParityCheck, extractV5MenuCodes, extractV63MenuCodes }', () => {
      const mod = require('../../scripts/migration/format-conversion/parity-harness');
      assert.equal(typeof mod.runParityCheck, 'function');
      assert.equal(typeof mod.extractV5MenuCodes, 'function');
      assert.equal(typeof mod.extractV63MenuCodes, 'function');
    });

    it('extractV5MenuCodes parses bracketed [XX] prefixes from <item> tags', () => {
      const { extractV5MenuCodes } = require('../../scripts/migration/format-conversion/parity-harness');
      const sample = `
<menu>
  <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
  <item cmd="LP or fuzzy match on lean-persona" exec="...">[LP] Create Lean Persona</item>
  <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
</menu>
`;
      const codes = extractV5MenuCodes(sample);
      assert.deepEqual(codes, ['MH', 'LP', 'DA']);
    });

    it('extractV63MenuCodes parses Code column from ## Capabilities table rows', () => {
      const { extractV63MenuCodes } = require('../../scripts/migration/format-conversion/parity-harness');
      const sample = `
## Capabilities

| Code | Description | Skill |
|------|-------------|-------|
| LP | Create Lean Persona | bmad-create-lean-persona |
| PV | Define Product Vision | bmad-create-product-vision |
| DA | Dismiss Agent | (none) |
`;
      const codes = extractV63MenuCodes(sample);
      // Note: header row `| Code |` is filtered because 'Code' is not a 2-3
      // uppercase letter match (mixed case).
      assert.deepEqual(codes, ['LP', 'PV', 'DA']);
    });

    it('runParityCheck returns documented shape on missing source file (no throw)', () => {
      const { runParityCheck } = require('../../scripts/migration/format-conversion/parity-harness');
      const result = runParityCheck({
        projectRoot: '/nonexistent-project-root-for-test',
        agentRoleName: 'fake-agent',
      });
      assert.equal(result.menuCodesEqual, null);
      assert.equal(result.postMigrationFile, 'not-yet-converted');
      assert.ok(Array.isArray(result.mismatches));
    });
  });

  describe('scripts/migration/format-conversion/covenant-survival-harness.js', () => {
    it('imports cleanly and exports { runCovenantSurvivalCheck, OPERATOR_RIGHTS, MATRIX_DECISION_RE_AUDIT, MATRIX_DECISION_DECLARE_VALID }', () => {
      const mod = require('../../scripts/migration/format-conversion/covenant-survival-harness');
      assert.equal(typeof mod.runCovenantSurvivalCheck, 'function');
      assert.ok(Array.isArray(mod.OPERATOR_RIGHTS));
      assert.equal(mod.OPERATOR_RIGHTS.length, 7);
      assert.equal(mod.MATRIX_DECISION_RE_AUDIT, 're-audit');
      assert.equal(mod.MATRIX_DECISION_DECLARE_VALID, 'declare-valid');
    });

    it('runCovenantSurvivalCheck returns no-matrix-supplied when matrix absent (no throw)', () => {
      const { runCovenantSurvivalCheck } = require('../../scripts/migration/format-conversion/covenant-survival-harness');
      const result = runCovenantSurvivalCheck({
        projectRoot: PROJECT_ROOT,
        agentRoleName: 'contextualization-expert',
        baselineAuditPath: '/some/baseline.md',
      });
      assert.equal(result.status, 'no-matrix-supplied');
      assert.ok(typeof result.message === 'string');
    });
  });

  describe('scripts/migration/format-conversion/personality-harness.js', () => {
    it('imports cleanly and exports { runPersonalityCheck }', () => {
      const mod = require('../../scripts/migration/format-conversion/personality-harness');
      assert.equal(typeof mod.runPersonalityCheck, 'function');
    });

    it('runPersonalityCheck throws on invalid mode (per AC7 explicit contract)', () => {
      const { runPersonalityCheck } = require('../../scripts/migration/format-conversion/personality-harness');
      assert.throws(
        () => runPersonalityCheck({
          projectRoot: PROJECT_ROOT,
          agentRoleName: 'contextualization-expert',
          fixtureRoot: path.join(PROJECT_ROOT, 'tests/migration/personality-preservation/fixtures'),
          rubricPath: path.join(PROJECT_ROOT, '_bmad-output/planning-artifacts/convoke-spec-personality-preservation-rubric.md'),
          mode: 'unknown-mode',
        }),
        /Invalid mode: expected 'capture' or 'verify', got 'unknown-mode'/,
      );
    });

    it('runPersonalityCheck throws on undefined mode (per AC7)', () => {
      const { runPersonalityCheck } = require('../../scripts/migration/format-conversion/personality-harness');
      assert.throws(
        () => runPersonalityCheck({
          projectRoot: PROJECT_ROOT,
          agentRoleName: 'contextualization-expert',
          fixtureRoot: path.join(PROJECT_ROOT, 'tests/migration/personality-preservation/fixtures'),
          rubricPath: path.join(PROJECT_ROOT, '_bmad-output/planning-artifacts/convoke-spec-personality-preservation-rubric.md'),
          // mode intentionally omitted
        }),
        /Invalid mode/,
      );
    });
  });

  describe('scripts/audit/reference-integrity.js', () => {
    it('imports cleanly and exports { runReferenceIntegrityCheck, COVERAGE_SCOPES }', () => {
      const mod = require('../../scripts/audit/reference-integrity');
      assert.equal(typeof mod.runReferenceIntegrityCheck, 'function');
      assert.equal(typeof mod.COVERAGE_SCOPES, 'object');
      // Per architecture § D4 line 217 — 5 coverage scopes.
      assert.equal(Object.keys(mod.COVERAGE_SCOPES).length, 5);
    });

    it('--help exits 0 with usage on stdout', () => {
      const stdout = execFileSync(
        process.execPath,
        [path.join(PROJECT_ROOT, 'scripts/audit/reference-integrity.js'), '--help'],
        // Round 1 review patch P28: explicit timeout to prevent test
        // deadlock if --help ever hangs (e.g., accidental `await` in
        // `_runCli`).
        { encoding: 'utf8', timeout: 5000 },
      );
      assert.match(stdout, /reference-integrity/);
      assert.match(stdout, /Usage:/);
      assert.match(stdout, /Exit codes:/);
    });

    it('skips refs containing {{...}} template placeholders (per AC4 amendment)', () => {
      // Round 1 review patch P34: assert the {{...}} filter behavior so
      // it's discoverable in the test suite (per Round 1 review decision
      // D5(b)).
      const { runReferenceIntegrityCheck } = require('../../scripts/audit/reference-integrity');
      // Build a minimal scope with a markdown file that has both a real
      // ref and a {{...}} placeholder. Use a tmpDir to avoid touching
      // project state.
      const { setupTmpDir } = require('../../scripts/migration/format-conversion/fixtures/tmpDir-setup');
      const fsx = require('fs-extra');
      const { tmpDir, cleanup } = setupTmpDir({ prefix: 'convoke-i97-loadtest-' });
      try {
        const docPath = path.join(tmpDir, 'tests', 'sample.md');
        fsx.ensureDirSync(path.dirname(docPath));
        fsx.writeFileSync(
          docPath,
          // Two refs: one is a {{...}} placeholder (must be skipped),
          // one is a self-reference to this same file (must validate as
          // existing).
          '# Sample\n\n[placeholder]({{path}})\n\n[self](./sample.md)\n',
          'utf8',
        );
        const result = runReferenceIntegrityCheck({
          projectRoot: tmpDir,
          scopePaths: ['tests/sample.md'],
        });
        // The {{path}} ref should be skipped (not flagged as broken),
        // and the self-ref should validate as existing.
        assert.equal(
          result.brokenRefs.length,
          0,
          `Expected zero broken refs (placeholder filtered, self-ref valid); got ${result.brokenRefs.length}: ${JSON.stringify(result.brokenRefs)}`,
        );
        // Both refs are extracted and counted in totalRefs; the placeholder
        // filter applies during validation (not during extraction). What
        // matters is that brokenRefs.length === 0 — the placeholder's
        // missing target does not produce a broken finding.
        assert.equal(result.totalRefs, 2, 'Expected 2 refs counted (both extracted; filter applies at validation, not extraction)');
      } finally {
        cleanup();
      }
    });
  });
});
