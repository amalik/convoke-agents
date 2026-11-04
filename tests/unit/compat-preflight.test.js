'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');

const { createTempDir } = require('../helpers');
const { execFileSync } = require('child_process');
const {
  runCompatPreflight, meetsBmadFloor, REQUIRED_BMAD_VERSION, _internal,
} = require('../../scripts/update/lib/compat-preflight');

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

// ─── BUG-20: BMAD's installer records its version in _bmad/_config/manifest.yaml ──
//
// BMAD is installed with `npx bmad-method install`, which never writes
// node_modules/bmad-method. Reading only node_modules reported "BMAD core not detected" on
// every project where BMAD IS installed, and the version floor never ran.

/** Write `_bmad/_config/manifest.yaml` with the given raw YAML text. */
async function seedManifest(tmpDir, yamlText) {
  const dir = path.join(tmpDir, '_bmad/_config');
  await fs.ensureDir(dir);
  await fs.writeFile(path.join(dir, 'manifest.yaml'), yamlText, 'utf8');
}

/** The shape BMAD 6.x writes: an installation block and a modules list. */
function manifestYaml({ installation = '6.10.0', core = '6.10.0', extra = '' } = {}) {
  const lines = ['installation:'];
  if (installation !== null) lines.push(`  version: ${installation}`);
  lines.push('  installDate: 2026-02-01T22:14:37.688Z', 'modules:');
  if (core !== null) lines.push('  - name: core', `    version: ${core}`, '    source: built-in');
  lines.push('  - name: tea', '    version: v1.21.7', '    source: external');
  return lines.join('\n') + '\n' + extra;
}

describe('compat-preflight reads the BMAD install record (BUG-20)', () => {

  it('manifest records core 6.10.0, no node_modules → silent pass', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml());
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.equal(result.version, '6.10.0');
      assert.equal(result.source, 'manifest');
      assert.equal(result.warning, null);
      assert.equal(stderr, '', `expected no stderr; got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('manifest records core 6.2.0 → floor WARNING with the installer upgrade command', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml({ installation: '6.2.0', core: '6.2.0' }));
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.equal(result.version, '6.2.0');
      assert.ok(stderr.includes('BMAD 6.2.0 detected'), `got: ${JSON.stringify(stderr)}`);
      // A manifest install is upgraded by re-running BMAD's installer, not by npm install.
      assert.ok(stderr.includes('npx bmad-method@latest install'), `got: ${JSON.stringify(stderr)}`);
      assert.ok(!stderr.includes('npm install bmad-method'), `got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('the core module version decides, not installation.version', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml({ installation: '6.10.0', core: '6.2.0' }));
      const { result } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.version, '6.2.0');
      assert.ok(result.warning && result.warning.includes('requires'), `got: ${JSON.stringify(result)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('no core module entry → installation.version is used', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml({ installation: '6.2.0', core: null }));
      const { result } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.equal(result.version, '6.2.0');
      assert.ok(result.warning && result.warning.includes('requires'), `got: ${JSON.stringify(result)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('a `v`-prefixed version, as BMAD writes for external modules, is read as the number', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml({ installation: null, core: 'v6.2.0' }));
      const { result } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.ok(result.warning && result.warning.includes('requires'), `got: ${JSON.stringify(result)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('an unquoted two-part core version is read as written, not as the YAML number 6.1', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      // The default YAML schema loads `6.10` as the number 6.1, below the floor.
      await seedManifest(tmpDir, manifestYaml({ installation: null, core: '6.10' }));
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.equal(result.version, '6.10');
      assert.equal(stderr, '', `got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('an unquoted integer core version is read, not reported as no version', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml({ installation: null, core: '7' }));
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.version, '7');
      assert.equal(stderr, '', `got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('a core value that is not a version falls through to installation.version', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml({ installation: '6.10.0', core: 'latest' }));
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.equal(result.version, '6.10.0');
      assert.equal(stderr, '', `got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('a manifest with no usable version falls through to node_modules', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml({ installation: '6.x', core: 'latest' }));
      await seedBmadPackage(tmpDir, '6.4.0');
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.source, 'package');
      assert.equal(result.version, '6.4.0');
      assert.equal(stderr, '', `got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('the unusable values are named when nothing else is found', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml({ installation: '6.x', core: 'latest' }));
      const { result } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, false);
      assert.ok(result.warning.includes('records no usable version'), result.warning);
      assert.ok(result.warning.includes('"latest"') && result.warning.includes('"6.x"'), result.warning);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  for (const written of ['V6.10.0', ' v 6.10.0 ']) {
    it(`a core version written ${JSON.stringify(written)} is read as 6.10.0`, async () => {
      const tmpDir = await createTempDir('bmad-pref-');
      try {
        await seedManifest(tmpDir, manifestYaml({ installation: null, core: JSON.stringify(written) }));
        const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
        assert.equal(result.version, '6.10.0');
        assert.equal(stderr, '', `got: ${JSON.stringify(stderr)}`);
      } finally {
        await fs.remove(tmpDir);
      }
    });
  }

  it('a manifest path that is a directory is refused as not a regular file', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await fs.ensureDir(path.join(tmpDir, '_bmad/_config/manifest.yaml'));
      const { result } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, false);
      assert.ok(result.warning.includes('is not a regular file'), result.warning);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // A named pipe stats at size 0, so the cap does not stop it, and readFileSync on it blocks until a
  // writer appears — forever, in an install. Run in a child so a regression fails on its timeout.
  it('a manifest that is a named pipe is refused without reading it', { skip: process.platform === 'win32' }, async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await fs.ensureDir(path.join(tmpDir, '_bmad/_config'));
      execFileSync('mkfifo', [path.join(tmpDir, '_bmad/_config/manifest.yaml')]);
      const mod = path.join(__dirname, '../../scripts/update/lib/compat-preflight.js');
      const out = execFileSync(process.execPath,
        ['-e', `console.log(JSON.stringify(require(${JSON.stringify(mod)}).detectBmadInstall(${JSON.stringify(tmpDir)})))`],
        { timeout: 10000, encoding: 'utf8' });
      const result = JSON.parse(out);
      assert.equal(result.found, false);
      assert.ok(result.reason.includes('is not a regular file'), result.reason);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('the manifest wins over node_modules when both exist', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml());
      await seedBmadPackage(tmpDir, '6.2.0');
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.source, 'manifest');
      assert.equal(result.version, '6.10.0');
      assert.equal(stderr, '');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('an unparseable manifest falls back to node_modules', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, 'installation: [unclosed\n');
      await seedBmadPackage(tmpDir, '6.4.0');
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, true);
      assert.equal(result.source, 'package');
      assert.equal(stderr, '');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('a manifest with no usable version and no package → WARNING naming both sources', async () => {
    const tmpDir = await createTempDir('bmad-pref-');
    try {
      await seedManifest(tmpDir, manifestYaml({ installation: null, core: null }));
      const { result, stderr } = captureStderr(() => runCompatPreflight(tmpDir));
      assert.equal(result.detected, false);
      assert.ok(stderr.includes('BMAD core not detected'), `got: ${JSON.stringify(stderr)}`);
      assert.ok(stderr.includes('manifest.yaml'), `got: ${JSON.stringify(stderr)}`);
      assert.ok(stderr.includes('node_modules'), `got: ${JSON.stringify(stderr)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('a manifest exactly at the size cap is not read, and one byte under it is', async () => {
    const cap = _internal.PKG_JSON_MAX_BYTES;
    for (const [size, readable] of [[cap, false], [cap - 1, true]]) {
      const tmpDir = await createTempDir('bmad-pref-');
      try {
        const body = manifestYaml();
        await seedManifest(tmpDir, body + '#'.repeat(size - Buffer.byteLength(body)));
        assert.equal(fs.statSync(path.join(tmpDir, '_bmad/_config/manifest.yaml')).size, size);
        const { result } = captureStderr(() => runCompatPreflight(tmpDir));
        assert.equal(result.detected, readable, `size ${size}: ${JSON.stringify(result)}`);
        if (!readable) assert.ok(result.warning.includes('cap'), result.warning);
      } finally {
        await fs.remove(tmpDir);
      }
    }
  });

  it('meetsBmadFloor compares against REQUIRED_BMAD_VERSION, suffix dropped', () => {
    assert.equal(meetsBmadFloor(REQUIRED_BMAD_VERSION), true);
    assert.equal(meetsBmadFloor('6.10.0'), true);
    assert.equal(meetsBmadFloor('6.2.9'), false);
    assert.equal(meetsBmadFloor('6.2.0-rc.1'), false);
  });

  // project-context.md §preflight-soft-warn, as amended for BUG-20: live smoke against the dev
  // tree must REPORT what it detects. This repository has BMAD installed and its install
  // record committed, so the honest output here is silence and the recorded core version.
  it('live smoke: this repository has BMAD installed, and the preflight says so', () => {
    const repoRoot = path.join(__dirname, '../..');
    // Expected value taken from the raw text with a pattern of its own, not by repeating the
    // module's parse — a test that parses the way production does shares production's mistakes.
    const raw = fs.readFileSync(path.join(repoRoot, '_bmad/_config/manifest.yaml'), 'utf8');
    const m = raw.match(/^ {2}- name: core\n {4}version: (\d+\.\d+\.\d+)$/m);
    assert.ok(m, 'expected a `- name: core` entry with a plain N.N.N version in the committed record');
    const { result, stderr } = captureStderr(() => runCompatPreflight(repoRoot));
    assert.equal(result.detected, true, `got: ${JSON.stringify(result)}`);
    assert.equal(result.version, m[1]);
    assert.equal(stderr, '', `expected no stderr on a tree with BMAD installed; got: ${JSON.stringify(stderr)}`);
  });

});
