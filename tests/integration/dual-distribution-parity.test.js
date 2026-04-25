const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('fs-extra');
const os = require('node:os');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const {
  marketplaceInstall,
  formatHint,
  canonicalIdForSkillRel,
  isExcluded
} = require('./lib/marketplace-installer-sim');
const { runScript, PACKAGE_ROOT } = require('../helpers');

// Read marketplace.json fresh (NOT via require()) per Story 3.4 V-pass E4 — Node
// caches require() results; reading via fs.readFileSync prevents stale state if
// a future test mutates the file mid-suite.
function readMarketplace() {
  return JSON.parse(
    fs.readFileSync(path.join(PACKAGE_ROOT, '.claude-plugin/marketplace.json'), 'utf8')
  );
}

const auditScript = path.join(PACKAGE_ROOT, 'scripts/audit/audit-skill-dirs.js');
const DEBUG = process.env.DEBUG?.split(/[\s,]+/).includes('convoke:parity');

// AC6 + Decision 4: perf-budget skip + surface (R1-M1).
// node:test doesn't allow before() to skip downstream it() blocks retroactively;
// the standard pattern is to set a flag in before() and check it at the start
// of each it().
const PERF_BUDGET_MS = 10000;

/**
 * Read SKILL.md bytes for a given skillRel (relative to a sandbox root).
 * Returns null if the file doesn't exist.
 */
function readSkillMdBytes(root, skillRel) {
  const cleanRel = skillRel.replace(/^\.\//, '');
  const skillMd = path.join(root, cleanRel, 'SKILL.md');
  if (!fs.existsSync(skillMd)) return null;
  return fs.readFileSync(skillMd);
}

/**
 * Find first byte that differs between two buffers (R1-M2).
 * Returns -1 if buffers are equal up to min(a.length, b.length).
 */
function firstDifferingOffset(a, b) {
  const min = Math.min(a.length, b.length);
  for (let i = 0; i < min; i++) {
    if (a[i] !== b[i]) return i;
  }
  return a.length === b.length ? -1 : min;
}

/**
 * Per Decision 1 v2: assert SKILL.md content is byte-equal across source +
 * sandbox A's `_bmad/<skillRel>/SKILL.md` + sandbox B's
 * `.claude/skills/<canonicalId>/SKILL.md`.
 *
 * Failure messages include path + mode + first-differing-offset + size delta
 * per AC3 + AC5.
 */
function assertContentEquivalence(skillRels, sourceRoot, sandboxA, sandboxB) {
  for (const skillRel of skillRels) {
    const cleanRel = skillRel.replace(/^\.\//, '');
    const canonicalId = canonicalIdForSkillRel(skillRel);

    const sourceBytes = readSkillMdBytes(sourceRoot, cleanRel);
    assert.ok(sourceBytes, formatHint('source-missing', cleanRel));

    const npmBytes = readSkillMdBytes(sandboxA, cleanRel);
    assert.ok(npmBytes, formatHint('npm-missing', `${cleanRel}/SKILL.md in sandbox A`));

    const marketplaceMd = path.join(sandboxB, '.claude/skills', canonicalId, 'SKILL.md');
    const marketplaceBytes = fs.existsSync(marketplaceMd) ? fs.readFileSync(marketplaceMd) : null;
    assert.ok(marketplaceBytes, formatHint('marketplace-sim-missing', canonicalId));

    if (DEBUG) {
      console.log(
        `  [parity] ${canonicalId} — source ${sourceBytes.length}B / npm ${npmBytes.length}B / marketplace ${marketplaceBytes.length}B`
      );
    }

    if (Buffer.compare(sourceBytes, npmBytes) !== 0) {
      const offset = firstDifferingOffset(sourceBytes, npmBytes);
      const ctx = `${canonicalId}: sandbox A vs source; ${sourceBytes.length}B vs ${npmBytes.length}B; first-differing-offset: ${offset}; mode: byte-diff`;
      throw new assert.AssertionError({
        message: formatHint('byte-diff', ctx),
        actual: 'byte-diff', expected: 'byte-equal', operator: 'Buffer.compare'
      });
    }
    if (Buffer.compare(sourceBytes, marketplaceBytes) !== 0) {
      const offset = firstDifferingOffset(sourceBytes, marketplaceBytes);
      const ctx = `${canonicalId}: sandbox B vs source; ${sourceBytes.length}B vs ${marketplaceBytes.length}B; first-differing-offset: ${offset}; mode: byte-diff`;
      throw new assert.AssertionError({
        message: formatHint('byte-diff', ctx),
        actual: 'byte-diff', expected: 'byte-equal', operator: 'Buffer.compare'
      });
    }
  }
}

describe('Dual-distribution parity (FR22)', () => {
  let sandboxA;
  let sandboxB;
  let marketplace;
  // R1-M1: perf-budget skip flag — set in before() if AC6 budget exceeded
  let perfExceeded = false;
  let perfDiagnostic = '';

  before(async () => {
    const start = Date.now();
    marketplace = readMarketplace();

    sandboxA = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-parity-npm-'));
    sandboxB = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-parity-mkt-'));
    await fs.ensureDir(path.join(sandboxA, '_bmad'));

    // Sandbox A: npm-standalone install via direct refreshInstallation API call
    // (per AC2 — NOT shelling out to convoke-install CLI; installer-e2e covers CLI).
    await refreshInstallation(sandboxA, { backupGuides: false, verbose: false });

    // Sandbox B: simulated-marketplace install via Convoke-side simulator
    // (replicates BMAD's marketplace install END STATE per Decision 2 v2).
    await marketplaceInstall(sandboxB, { sourceRepo: PACKAGE_ROOT });

    const elapsed = Date.now() - start;
    if (elapsed > PERF_BUDGET_MS) {
      perfExceeded = true;
      perfDiagnostic = `before() took ${elapsed}ms; AC6 budget is ${PERF_BUDGET_MS}ms`;
    }
  });

  after(async () => {
    // R1-M5: cleanup nullity guards — if mkdtemp failed for either sandbox,
    // fs.remove(undefined) would mask the original error.
    if (sandboxA) await fs.remove(sandboxA).catch(() => {});
    if (sandboxB) await fs.remove(sandboxB).catch(() => {});
  });

  // I1: Schema-guard pass.
  it('I1: marketplace.json schema-guard — plugins[0].skills.length > 0', (t) => {
    if (perfExceeded) { t.skip(`AC6 perf budget exceeded — ${perfDiagnostic}`); return; }
    assert.ok(
      marketplace.plugins?.[0]?.skills?.length > 0,
      'marketplace metadata regression — plugins[0].skills missing or empty'
    );
  });

  // I2: npm-vs-source content equivalence (sandbox A's _bmad/<skillRel>/SKILL.md
  // matches source repo).
  it('I2: per-agent SKILL.md content matches source in sandbox A (npm-standalone)', (t) => {
    if (perfExceeded) { t.skip(`AC6 perf budget exceeded — ${perfDiagnostic}`); return; }
    for (const skillRel of marketplace.plugins[0].skills) {
      const cleanRel = skillRel.replace(/^\.\//, '');
      const canonicalId = canonicalIdForSkillRel(skillRel);

      const sourceBytes = readSkillMdBytes(PACKAGE_ROOT, cleanRel);
      assert.ok(sourceBytes, `source SKILL.md missing for ${canonicalId}`);

      const npmBytes = readSkillMdBytes(sandboxA, cleanRel);
      assert.ok(npmBytes, formatHint('npm-missing', `${cleanRel}/SKILL.md missing in sandbox A`));

      if (Buffer.compare(sourceBytes, npmBytes) !== 0) {
        const offset = firstDifferingOffset(sourceBytes, npmBytes);
        const ctx = `${canonicalId}: sandbox A vs source; ${sourceBytes.length}B vs ${npmBytes.length}B; first-differing-offset: ${offset}; mode: byte-diff`;
        assert.fail(formatHint('byte-diff', ctx));
      }
    }
  });

  // I3: marketplace-vs-source content equivalence (sandbox B's
  // .claude/skills/<canonicalId>/SKILL.md matches source repo).
  it('I3: per-agent SKILL.md content matches source in sandbox B (simulated-marketplace)', (t) => {
    if (perfExceeded) { t.skip(`AC6 perf budget exceeded — ${perfDiagnostic}`); return; }
    for (const skillRel of marketplace.plugins[0].skills) {
      const cleanRel = skillRel.replace(/^\.\//, '');
      const canonicalId = canonicalIdForSkillRel(skillRel);

      const sourceBytes = readSkillMdBytes(PACKAGE_ROOT, cleanRel);
      assert.ok(sourceBytes, `source SKILL.md missing for ${canonicalId}`);

      const marketplaceMd = path.join(sandboxB, '.claude/skills', canonicalId, 'SKILL.md');
      assert.ok(fs.existsSync(marketplaceMd), formatHint('marketplace-sim-missing', canonicalId));
      const marketplaceBytes = fs.readFileSync(marketplaceMd);

      if (Buffer.compare(sourceBytes, marketplaceBytes) !== 0) {
        const offset = firstDifferingOffset(sourceBytes, marketplaceBytes);
        const ctx = `${canonicalId}: sandbox B vs source; ${sourceBytes.length}B vs ${marketplaceBytes.length}B; first-differing-offset: ${offset}; mode: byte-diff`;
        assert.fail(formatHint('byte-diff', ctx));
      }
    }
  });

  // I4: Drift detection — parameterized over EVERY skill (R1-H2). Previous
  // version mutated only skills[0] and the helper short-circuits on first
  // mismatch, so it only proved drift was caught for the first entry.
  // Now: clone sandbox B, mutate one skill at a time, verify the helper
  // catches each one specifically. Sub-fixture per V-pass E10 ensures
  // mutations don't pollute other tests.
  it('I4: drift detection — mutated SKILL.md fails parity for any skill, with hint', async (t) => {
    if (perfExceeded) { t.skip(`AC6 perf budget exceeded — ${perfDiagnostic}`); return; }
    for (const skillRel of marketplace.plugins[0].skills) {
      const sandboxBPrime = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-parity-mkt-prime-'));
      try {
        await fs.copy(sandboxB, sandboxBPrime);
        const canonicalId = canonicalIdForSkillRel(skillRel);
        const targetMd = path.join(sandboxBPrime, '.claude/skills', canonicalId, 'SKILL.md');
        const original = fs.readFileSync(targetMd);
        // Append one byte — guaranteed difference, doesn't risk multi-byte
        // UTF-8 mid-codepoint corruption.
        fs.writeFileSync(targetMd, Buffer.concat([original, Buffer.from([0x21])]));

        // R1-M6: assert.throws predicate must require AssertionError +
        // hint match — bare regex would also satisfy non-AssertionError
        // throws (e.g., a TypeError from Buffer.compare(null, …)).
        assert.throws(
          () => assertContentEquivalence(
            marketplace.plugins[0].skills,
            PACKAGE_ROOT,
            sandboxA,
            sandboxBPrime
          ),
          (err) => err instanceof assert.AssertionError && /byte-diff/i.test(err.message) && err.message.includes(canonicalId),
          `drift assertion should fail with byte-diff hint naming ${canonicalId}`
        );
      } finally {
        await fs.remove(sandboxBPrime).catch(() => {});
      }
    }
  });

  // I5 (per AC8.5): defensive cross-check via audit-skill-dirs against
  // sandbox A. Note: audit-skill-dirs walks .claude/skills/ — the wrapper
  // SKILL.md files (bmad-agent-bme-<id>/) refresh-installation seeds. It
  // does NOT audit the source SKILL.md at _bmad/bme/_vortex/agents/<id>/
  // that the parity assertion (I2/I3) actually compares (R1-M11). This
  // cross-check verifies refresh-installation produces v6.3-compliant
  // wrapper structure; the parity assertions verify SKILL.md content.
  // Sandbox B is intentionally NOT audited — flattened marketplace replica
  // doesn't match audit-skill-dirs scan expectations by design.
  it('I5: sandbox A passes audit-skill-dirs (wrapper-shape cross-check)', async (t) => {
    if (perfExceeded) { t.skip(`AC6 perf budget exceeded — ${perfDiagnostic}`); return; }
    const { exitCode, stderr } = await runScript(auditScript, [], { cwd: sandboxA });
    assert.equal(
      exitCode,
      0,
      `audit-skill-dirs should pass on sandbox A; exit=${exitCode}; stderr:\n${stderr}`
    );
  });
});

describe('Dual-distribution parity — exclusion list reuse', () => {
  // Sanity that the simulator's exclusion list matches expected BMAD-derived
  // behavior (mirrors BMAD's installVerbatimSkills filter at
  // ide-config-driven.js:171-178; PARITY_EXCLUSIONS adds /node_modules/
  // path-relative defensive extension).
  it('isExcluded matches BMAD filter for known noise basenames', () => {
    assert.equal(isExcluded('/x/.DS_Store'), true);
    assert.equal(isExcluded('/x/Thumbs.db'), true);
    assert.equal(isExcluded('/x/desktop.ini'), true);
    assert.equal(isExcluded('/x/foo.bak'), true);
    assert.equal(isExcluded('/x/foo~'), true);
    assert.equal(isExcluded('/x/foo.swp'), true);
    assert.equal(isExcluded('/x/foo.swo'), true);
    assert.equal(isExcluded('/x/.gitkeep'), false);
    assert.equal(isExcluded('/x/SKILL.md'), false);
  });
});
