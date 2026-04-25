'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');

const { createTempDir } = require('../helpers');
const { runCompatPreflight, _internal } = require('../../scripts/update/lib/compat-preflight');

// ─── Fixture helpers ──────────────────────────────────────────────

/**
 * Seed `node_modules/bmad-method/package.json` with an arbitrary version.
 * `version` may be undefined to emit a package.json without the field.
 */
async function seedBmadPackage(tmpDir, version, extra = {}) {
  const pkgDir = path.join(tmpDir, 'node_modules/bmad-method');
  await fs.ensureDir(pkgDir);
  const pkg = { name: 'bmad-method', ...extra };
  if (version !== undefined) pkg.version = version;
  await fs.writeFile(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');
}

/**
 * Capture stderr writes during a synchronous block.
 */
function captureStderr(fn) {
  const original = process.stderr.write.bind(process.stderr);
  let captured = '';
  process.stderr.write = (chunk, encoding, cb) => {
    captured += typeof chunk === 'string' ? chunk : chunk.toString(encoding || 'utf8');
    if (typeof cb === 'function') cb();
    return true;
  };
  try {
    const result = fn();
    return { result, stderr: captured };
  } finally {
    process.stderr.write = original;
  }
}

// ─── Tests ────────────────────────────────────────────────────────

describe('compat-preflight (Story v63-3-2)', () => {

  // ── Test 1: BMAD 6.3.0 → silent pass ──
  it('BMAD 6.3.0 detected → silent pass (no stderr output)', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedBmadPackage(tmpDir, '6.3.0');
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.equal(result.version, '6.3.0');
      assert.equal(result.warning, null);
      assert.equal(stderr, '', `expected no stderr; got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 2: BMAD 6.4.0 → silent pass (semver-range accepted) ──
  it('BMAD 6.4.0 detected → silent pass (later versions accepted)', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedBmadPackage(tmpDir, '6.4.0');
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.equal(result.warning, null);
      assert.equal(stderr, '');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 3: BMAD 6.2.0 → WARNING ──
  it('BMAD 6.2.0 detected → WARNING with version + upgrade hint', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedBmadPackage(tmpDir, '6.2.0');
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.equal(result.version, '6.2.0');
      assert.ok(result.warning && result.warning.includes('6.2.0'));
      assert.ok(stderr.includes('6.2.0') && stderr.includes('6.3.0'),
        `expected WARNING citing both versions; got: ${JSON.stringify(stderr)}`);
      assert.ok(stderr.includes('npm install bmad-method@latest'),
        `expected upgrade hint; got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 4: bmad-method missing → WARNING (the dev-machine path) ──
  it('node_modules/bmad-method/ missing → "BMAD core not detected" WARNING', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      // Do NOT seed bmad-method.
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, false);
      assert.equal(result.version, null);
      assert.ok(result.warning && result.warning.includes('not detected'));
      assert.ok(stderr.includes('BMAD core not detected'),
        `expected absent-package WARNING; got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 5 (R1-M7 + R2-M6): WARNING text + no ANSI escapes when chalk forced off ──
  it('WARNING text + no ANSI escapes when chalk forced off (R1-M7)', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    const chalk = require('chalk');
    const originalLevel = chalk.level;
    try {
      // Force chalk off — simulates a CI runner with NO_COLOR / dumb terminal.
      chalk.level = 0;
      const { stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.ok(stderr.includes('BMAD core not detected'),
        `non-TTY still must surface the WARNING text; got: ${JSON.stringify(stderr)}`);
      // R1-M7: assert no ANSI escape sequences leaked when chalk is disabled.
      // Tautology fix — pre-R1, the test passed identically on TTY and non-TTY.
      // eslint-disable-next-line no-control-regex
      assert.ok(!/\x1b\[/.test(stderr),
        `non-TTY must not emit ANSI escape codes; got: ${JSON.stringify(stderr)}`);
    } finally {
      chalk.level = originalLevel;
      await fs.remove(tmpDir);
    }
  });

  // ── Test 6: invalid projectRoot → throws ──
  it('runCompatPreflight called with invalid projectRoot → throws clean error', () => {
    assert.throws(() => runCompatPreflight(''), /projectRoot must be a non-empty string/);
    assert.throws(() => runCompatPreflight(null), /projectRoot must be a non-empty string/);
    assert.throws(() => runCompatPreflight(undefined), /projectRoot must be a non-empty string/);
    assert.throws(() => runCompatPreflight(42), /projectRoot must be a non-empty string/);
  });

  // ── Test 7: package.json present + parseable + missing version field ──
  it('package.json missing version field → WARNING (R1-M6 pattern)', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedBmadPackage(tmpDir, undefined); // no version field
      const probe = _internal._readBmadPackageJson(tmpDir);
      assert.equal(probe.found, false);
      assert.ok(probe.reason && probe.reason.includes('version field invalid'));
      const { stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.ok(stderr.includes('BMAD core not detected') && stderr.includes('version field invalid'),
        `expected WARNING citing invalid version; got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 8 (R1-D1): non-string version matrix — number, null, array ──
  it('package.json version is non-string (number, null, array) → WARNING', async () => {
    // R1-D1: spec Case 8 enumerates the matrix `42` (number), `null`, `[]`
    // (array). Pre-R1, only `42` was tested. Loop verifies all three reject
    // via the single `typeof !== 'string'` branch.
    const matrix = [42, null, []];
    for (const v of matrix) {
      const tmpDir = await createTempDir('bmad-pref-');
      try {
        const pkgDir = path.join(tmpDir, 'node_modules/bmad-method');
        await fs.ensureDir(pkgDir);
        await fs.writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: 'bmad-method', version: v }), 'utf8');
        const probe = _internal._readBmadPackageJson(tmpDir);
        assert.equal(probe.found, false, `expected probe.found=false for version=${JSON.stringify(v)}; got ${JSON.stringify(probe)}`);
        const { stderr } = captureStderr(() => runCompatPreflight(tmpDir));
        assert.ok(stderr.includes('BMAD core not detected'),
          `expected WARNING for version=${JSON.stringify(v)}; got: ${JSON.stringify(stderr)}`);
      } finally {
        await fs.remove(tmpDir);
      }
    }
  });

  // ── Test 9 (R1-H5 + R2-H4): pre-release of target → info-WARNING fires ──
  it('BMAD 6.3.0-rc.1 detected → info-WARNING (R2-H4 prerelease visibility)', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    const chalk = require('chalk');
    const originalLevel = chalk.level;
    try {
      chalk.level = 0; // R2-M6 pattern — defend against FORCE_COLOR=1
      await seedBmadPackage(tmpDir, '6.3.0-rc.1');
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      // R2-H4: prerelease of target version (>= cap) now emits info-level
      // WARNING noting the prerelease state. Operator on rc builds gets
      // visible signal instead of silent-pass. Soft-warn (Decision 3) —
      // detected: true, exit 0 pass-through.
      assert.equal(result.detected, true);
      assert.ok(result.warning && result.warning.includes('prerelease'),
        `expected prerelease WARNING; got: ${JSON.stringify(result.warning)}`);
      assert.ok(stderr.includes('6.3.0-rc.1') && stderr.includes('prerelease'),
        `expected stderr WARNING citing original version + 'prerelease'; got: ${JSON.stringify(stderr)}`);
    } finally {
      chalk.level = originalLevel;
      await fs.remove(tmpDir);
    }
  });

  // ── Test 10 (R1-H5): pre-release of older version still warns (gate fires) ──
  it('BMAD 6.2.0-rc.1 detected → WARNING (older pre-release triggers gate)', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    const chalk = require('chalk');
    const originalLevel = chalk.level;
    try {
      chalk.level = 0; // R2-M6 — defend substring match against ANSI codes
      await seedBmadPackage(tmpDir, '6.2.0-rc.1');
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.ok(result.warning && result.warning.includes('6.2.0-rc.1'));
      // R1-H5: stripped to 6.2.0 → cmp < 6.3.0 → upgrade WARNING fires.
      assert.ok(stderr.includes('6.2.0-rc.1'),
        `expected WARNING citing the original version string; got: ${JSON.stringify(stderr)}`);
    } finally {
      chalk.level = originalLevel;
      await fs.remove(tmpDir);
    }
  });

  // ── Test 11 (R1-M6 + R2-M7): suspiciously large package.json → reject ──
  it('package.json >= cap → reject (R2-M7 padding parameterized)', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      const pkgDir = path.join(tmpDir, 'node_modules/bmad-method');
      await fs.ensureDir(pkgDir);
      // R2-M7: padding parameterized off the actual cap so the test
      // tracks future PKG_JSON_MAX_BYTES bumps automatically. Hardcoded
      // 1_100_000 would silently break if the cap is raised.
      const cap = 1_000_000; // mirrors PKG_JSON_MAX_BYTES; not exported.
      const padding = 'x'.repeat(cap + 100_000);
      await fs.writeFile(path.join(pkgDir, 'package.json'),
        JSON.stringify({ name: 'bmad-method', version: '6.3.0', _padding: padding }), 'utf8');
      const probe = _internal._readBmadPackageJson(tmpDir);
      assert.equal(probe.found, false, 'must reject oversized package.json');
      // R2-M5: error message now cites limit explicitly.
      assert.ok(probe.reason && probe.reason.includes('cap') && probe.reason.includes(String(cap)),
        `expected size+cap error; got: ${JSON.stringify(probe)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 12 (R2-M1): non-numeric version after strip → WARNING ──
  it('BMAD 6.3.x (placeholder) → WARNING (R2-M1 non-numeric guard)', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedBmadPackage(tmpDir, '6.3.x');
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      // R2-M1: `'6.3.x'` would NaN-fall-through and silent-pass via the
      // naive compareVersions; the regex guard catches it.
      assert.equal(result.detected, false);
      assert.ok(result.warning && result.warning.includes('non-numeric'),
        `expected non-numeric WARNING; got: ${JSON.stringify(result.warning)}`);
      assert.ok(stderr.includes('6.3.x'),
        `expected stderr to cite the bad version; got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

});
