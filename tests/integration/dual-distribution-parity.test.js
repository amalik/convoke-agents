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
//
// R2-M5: node:test's `t.skip(reason)` is a TAG, not an abort — execution
// continues after the call. Each it() that consults `perfExceeded` MUST
// follow `t.skip(...)` with `return` to short-circuit; without the return,
// the test runs as if not skipped. Familiar Jest semantics (`it.skip`
// aborts) do NOT apply here.
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
 * Find first byte that differs between two buffers (R1-M2 + R2-M2).
 *
 * Semantics:
 *   - Returns the index of the first byte where bytes diverge.
 *   - Returns `min(a.length, b.length)` if one buffer is a strict prefix
 *     of the other (the truncation point — same numeric value as a real
 *     differing-byte at that offset; caller distinguishes via size delta).
 *   - Returns `-1` if buffers are byte-equal (same length AND same content).
 *   - Returns `-1` if either buffer is null/undefined (R2-M2 defensive guard;
 *     no upstream callers pass null today, but explicit beats a TypeError
 *     stack).
 */
function firstDifferingOffset(a, b) {
  if (!a || !b) return -1;
  const min = Math.min(a.length, b.length);
  for (let i = 0; i < min; i++) {
    if (a[i] !== b[i]) return i;
  }
  return a.length === b.length ? -1 : min;
}

/**
 * R2-M4: derive the FULL list of declared skillRels across every plugin.
 * Convoke's marketplace.json has only `plugins[0]` today, but the simulator
 * iterates `plugins[*].skills` (per Decision 2 v2). The parity tests must
 * cover the same surface — using `plugins[0].skills` would leave
 * `plugins[1+]` skills installed but never byte-checked.
 */
function allDeclaredSkillRels(m) {
  return m.plugins.flatMap(p => (p && p.skills) || []);
}

/**
 * R2-M3: shared byte-comparison helper. Returns a hint message if the
 * buffers differ; returns null on equality. Centralizes the byte-diff
 * formatting so I2/I3/assertContentEquivalence stay in sync.
 */
function compareBytesOrHint(actualBytes, expectedBytes, label) {
  if (Buffer.compare(actualBytes, expectedBytes) === 0) return null;
  const offset = firstDifferingOffset(actualBytes, expectedBytes);
  const ctx = `${label}; ${actualBytes.length}B vs ${expectedBytes.length}B; first-differing-offset: ${offset}; mode: byte-diff`;
  return formatHint('byte-diff', ctx);
}

/**
 * Per Decision 1 v2: assert SKILL.md content is byte-equal across source +
 * sandbox A's `_bmad/<skillRel>/SKILL.md` + sandbox B's
 * `.claude/skills/<canonicalId>/SKILL.md`.
 *
 * Failure messages include path + mode + first-differing-offset + size delta
 * per AC3 + AC5. Used by I4 drift-detection; I2/I3 use targeted single-side
 * helpers below.
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

    const npmHint = compareBytesOrHint(sourceBytes, npmBytes, `${canonicalId}: sandbox A vs source`);
    if (npmHint) {
      throw new assert.AssertionError({
        message: npmHint,
        actual: 'byte-diff', expected: 'byte-equal', operator: 'Buffer.compare'
      });
    }
    const marketplaceHint = compareBytesOrHint(sourceBytes, marketplaceBytes, `${canonicalId}: sandbox B vs source`);
    if (marketplaceHint) {
      throw new assert.AssertionError({
        message: marketplaceHint,
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
  it('I1: marketplace.json schema-guard — at least one declared skill', (t) => {
    if (perfExceeded) { t.skip(`AC6 perf budget exceeded — ${perfDiagnostic}`); return; }
    // R2-M4: aggregate across ALL plugins, not just plugins[0].
    assert.ok(
      allDeclaredSkillRels(marketplace).length > 0,
      'marketplace metadata regression — no skills declared in any plugin'
    );
  });

  // I2: npm-vs-source content equivalence (sandbox A's _bmad/<skillRel>/SKILL.md
  // matches source repo). R2-M3: routes through compareBytesOrHint helper.
  // R2-M4: iterates ALL plugins.
  it('I2: per-agent SKILL.md content matches source in sandbox A (npm-standalone)', (t) => {
    if (perfExceeded) { t.skip(`AC6 perf budget exceeded — ${perfDiagnostic}`); return; }
    for (const skillRel of allDeclaredSkillRels(marketplace)) {
      const cleanRel = skillRel.replace(/^\.\//, '');
      const canonicalId = canonicalIdForSkillRel(skillRel);

      const sourceBytes = readSkillMdBytes(PACKAGE_ROOT, cleanRel);
      assert.ok(sourceBytes, `source SKILL.md missing for ${canonicalId}`);

      const npmBytes = readSkillMdBytes(sandboxA, cleanRel);
      assert.ok(npmBytes, formatHint('npm-missing', `${cleanRel}/SKILL.md missing in sandbox A`));

      const hint = compareBytesOrHint(sourceBytes, npmBytes, `${canonicalId}: sandbox A vs source`);
      if (hint) assert.fail(hint);
    }
  });

  // I3: marketplace-vs-source content equivalence (sandbox B's
  // .claude/skills/<canonicalId>/SKILL.md matches source repo). R2-M3:
  // routes through compareBytesOrHint helper. R2-M4: iterates ALL plugins.
  it('I3: per-agent SKILL.md content matches source in sandbox B (simulated-marketplace)', (t) => {
    if (perfExceeded) { t.skip(`AC6 perf budget exceeded — ${perfDiagnostic}`); return; }
    for (const skillRel of allDeclaredSkillRels(marketplace)) {
      const canonicalId = canonicalIdForSkillRel(skillRel);
      const cleanRel = skillRel.replace(/^\.\//, '');

      const sourceBytes = readSkillMdBytes(PACKAGE_ROOT, cleanRel);
      assert.ok(sourceBytes, `source SKILL.md missing for ${canonicalId}`);

      const marketplaceMd = path.join(sandboxB, '.claude/skills', canonicalId, 'SKILL.md');
      assert.ok(fs.existsSync(marketplaceMd), formatHint('marketplace-sim-missing', canonicalId));
      const marketplaceBytes = fs.readFileSync(marketplaceMd);

      const hint = compareBytesOrHint(sourceBytes, marketplaceBytes, `${canonicalId}: sandbox B vs source`);
      if (hint) assert.fail(hint);
    }
  });

  // I4: Drift detection — parameterized over EVERY skill (R1-H2).
  // Clones sandbox B per iteration, mutates one skill at a time, asserts
  // the helper catches each one specifically. Sub-fixture per V-pass E10
  // ensures mutations don't pollute other tests. R2-M4: iterates all
  // plugins. R2-H2: relaxed predicate — drops `/byte-diff/i` requirement,
  // since iteration-order-dependent throws (e.g., a hypothetical
  // source-missing for the mutated skill from flaky FS) would still surface
  // the canonicalId in the message, and the alternative — re-throw as
  // "predicate failure" — masked the real cause.
  it('I4: drift detection — mutated SKILL.md fails parity for any skill, with hint', async (t) => {
    if (perfExceeded) { t.skip(`AC6 perf budget exceeded — ${perfDiagnostic}`); return; }
    const allSkillRels = allDeclaredSkillRels(marketplace);
    for (const skillRel of allSkillRels) {
      const sandboxBPrime = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-parity-mkt-prime-'));
      try {
        await fs.copy(sandboxB, sandboxBPrime);
        const canonicalId = canonicalIdForSkillRel(skillRel);
        const targetMd = path.join(sandboxBPrime, '.claude/skills', canonicalId, 'SKILL.md');
        const original = fs.readFileSync(targetMd);
        // Append one byte — guaranteed difference (length always changes
        // regardless of last byte), doesn't risk multi-byte UTF-8 mid-codepoint
        // corruption.
        fs.writeFileSync(targetMd, Buffer.concat([original, Buffer.from([0x21])]));

        // R2-H2: relaxed from `/byte-diff/i.test && includes(canonicalId)`
        // to just `includes(canonicalId)`. The previous strict regex would
        // reject legitimate AssertionError throws that happened to surface
        // before reaching byte-compare (e.g., npm-missing on a flaky FS),
        // re-throwing as confusing "predicate failure" instead of the real
        // cause. canonicalId is unique enough — only the mutated skill's
        // path appears in the message for that iteration's failure.
        assert.throws(
          () => assertContentEquivalence(allSkillRels, PACKAGE_ROOT, sandboxA, sandboxBPrime),
          (err) => err instanceof assert.AssertionError && err.message.includes(canonicalId),
          `drift assertion should fail with hint naming ${canonicalId}`
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
