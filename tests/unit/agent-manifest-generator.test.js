/**
 * Story gen-1.1 — agent manifest generation behind a deliberate path.
 *
 * Every test here runs against a temp `projectRoot`. The one exception is the AC4
 * test, which calls `refreshInstallation(PACKAGE_ROOT, …)` in order to assert that
 * **nothing is written** there — the one shape `test-fixture-isolation` exists to
 * protect, and the same shape six existing sites already use
 * (refresh-installation-enhance.test.js:76,232,302,359 and
 * refresh-installation-artifacts.test.js:74,178).
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { execFile } = require('child_process');

const {
  generateAgentManifest,
  CHANGE_MESSAGE,
  SKIP_MESSAGE,
  V610_HEADER,
} = require('../../scripts/lib/agent-manifest-generator');
const { checkDevelopmentCheckout } = require('../../scripts/generate-manifest');
const { PACKAGE_ROOT, silenceConsole, restoreConsole } = require('../helpers');

// --- Fixture shapes -------------------------------------------------------
// Deliberately synthetic. Seeding from the repo's own manifest would make every
// assertion here a function of live repo state (test-fixture-isolation), and would
// rot the moment an agent is added to the registry (fixture-determinism).

/** A non-bme row in v6.1.0 shape: 12 columns, module at index 9. */
const V610_FOREIGN_ROWS = [
  '"John","","Product Manager","📋","","role","identity","style","principles","bmm","_bmad/bmm/agents/pm.md","bmad-agent-pm"',
  '"Winston","","Architect","🏗️","","role","identity","style","principles","bmm","_bmad/bmm/agents/architect.md","bmad-agent-architect"',
];

/**
 * A legacy header — one that trips NEITHER limb of the schema predicate
 * (`startsWith('name,') || includes('canonicalId')`). 10 columns, submodule at
 * index 8, matching what buildAgentRowLegacy emits.
 */
const LEGACY_HEADER =
  'id,name,title,icon,role,identity,communicationStyle,expertise,submodule,path';

/** Non-bme rows in legacy shape: 10 quoted columns, submodule at index 8. */
const LEGACY_FOREIGN_ROWS = [
  '"pm","John","Product Manager","📋","role","identity","style","expertise","bmm","_bmad/bmm/agents/pm.md"',
  '"architect","Winston","Architect","🏗️","role","identity","style","expertise","bmm","_bmad/bmm/agents/architect.md"',
];

const NO_EXCLUSIONS = { vortex: [], gyre: [] };

function manifestPathIn(root) {
  return path.join(root, '_bmad', '_config', 'agent-manifest.csv');
}

async function seedManifest(root, header, rows) {
  const mp = manifestPathIn(root);
  await fs.ensureDir(path.dirname(mp));
  await fs.writeFile(mp, [header, ...rows].join('\n') + '\n', 'utf8');
  return mp;
}

async function tmpRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'gen11-'));
}

// =========================================================================
// AC1(i) — the module round-trips against a bme-row-perturbed fixture
// =========================================================================

describe('gen-1.1 AC1(i) — generator round-trips a perturbed bme row', () => {
  let root;
  let mp;

  beforeEach(async () => {
    root = await tmpRoot();
    mp = await seedManifest(root, V610_HEADER, V610_FOREIGN_ROWS);
  });
  afterEach(async () => {
    await fs.remove(root);
  });

  it('restores a perturbed bme row to the oracle byte-for-byte', async () => {
    // Oracle = what a clean run produces. Computed here rather than checked in, so
    // it cannot rot when the registry grows.
    await generateAgentManifest(root, { excluded: NO_EXCLUSIONS });
    const oracle = await fs.readFile(mp, 'utf8');

    // Perturb a BME row. This is the only perturbation that discriminates: a
    // non-bme sentinel is preserved by design (AC3) and truncation destroys the
    // preserved rows outright, so both stay dirty after a CORRECT run.
    const perturbed = oracle.replace(/^("Emma")/m, '"EmmaPERTURBED"');
    assert.notEqual(perturbed, oracle, 'fixture must actually change, or this test is a tautology');
    await fs.writeFile(mp, perturbed, 'utf8');

    await generateAgentManifest(root, { excluded: NO_EXCLUSIONS });
    const after = await fs.readFile(mp, 'utf8');

    assert.equal(after, oracle, 'regeneration must restore the perturbed bme row exactly');
  });

  it('leaves a non-bme sentinel row in place — the reason AC1 does not use one', async () => {
    await generateAgentManifest(root, { excluded: NO_EXCLUSIONS });
    const oracle = await fs.readFile(mp, 'utf8');

    const sentinel =
      '"ZZSentinel","","Sentinel","🧪","","r","i","s","p","bmm","_bmad/bmm/agents/zz.md","bmad-agent-zz"';
    await fs.writeFile(mp, oracle.trimEnd() + '\n' + sentinel + '\n', 'utf8');
    await generateAgentManifest(root, { excluded: NO_EXCLUSIONS });
    const after = await fs.readFile(mp, 'utf8');

    assert.ok(after.includes('ZZSentinel'), 'a foreign row must survive regeneration');
    assert.notEqual(after, oracle, 'so a sentinel cannot be used as AC1s perturbation');
  });

  it('returns the change message the caller reports', async () => {
    const msg = await generateAgentManifest(root, { excluded: NO_EXCLUSIONS });
    assert.equal(msg, CHANGE_MESSAGE);
  });
});

// =========================================================================
// AC3 — the target-tree model survives extraction
// =========================================================================

describe('gen-1.1 AC3 — target-tree dependencies', () => {
  let root;

  beforeEach(async () => {
    root = await tmpRoot();
  });
  afterEach(async () => {
    await fs.remove(root);
  });

  it('preserves non-bme rows and the v6.1.0 header', async () => {
    const mp = await seedManifest(root, V610_HEADER, V610_FOREIGN_ROWS);
    await generateAgentManifest(root, { excluded: NO_EXCLUSIONS });
    const out = await fs.readFile(mp, 'utf8');
    const lines = out.trim().split('\n');

    assert.equal(lines[0], V610_HEADER, 'header must be preserved verbatim');
    for (const row of V610_FOREIGN_ROWS) {
      assert.ok(lines.includes(row), `foreign row must be preserved verbatim: ${row.slice(0, 40)}`);
    }
    assert.ok(
      lines.some(l => l.includes('"bme"')),
      'bme rows must be regenerated alongside the preserved ones'
    );
  });

  it('detects the legacy schema and emits legacy-shaped bme rows', async () => {
    const mp = await seedManifest(root, LEGACY_HEADER, LEGACY_FOREIGN_ROWS);
    await generateAgentManifest(root, { excluded: NO_EXCLUSIONS });
    const out = await fs.readFile(mp, 'utf8');
    const lines = out.trim().split('\n');

    assert.equal(lines[0], LEGACY_HEADER, 'legacy header must not be upgraded silently');
    for (const row of LEGACY_FOREIGN_ROWS) {
      assert.ok(lines.includes(row), 'legacy foreign row must be preserved verbatim');
    }
    // A legacy bme row has 10 fields with 'bme' at index 8; a v6.1.0 row has 12
    // with 'bme' at index 9. Counting fields is what distinguishes the branches.
    const bmeLine = lines.find(l => l.includes('"bme"') && !LEGACY_FOREIGN_ROWS.includes(l));
    assert.ok(bmeLine, 'expected at least one generated bme row');
    assert.equal(bmeLine.split('","').length, 10, 'legacy bme rows carry 10 columns, not 12');
  });

  it('defaults a manifest-less tree to the v6.1.0 schema', async () => {
    await fs.ensureDir(path.join(root, '_bmad', '_config'));
    await generateAgentManifest(root, { excluded: NO_EXCLUSIONS });
    const out = await fs.readFile(manifestPathIn(root), 'utf8');
    assert.equal(out.split('\n')[0], V610_HEADER);
  });

  // "Usable, not merely present." Found by Round 1's edge-case layer; the same
  // defect was already fixed for skill-manifest.csv at refresh-installation.js:509.
  // Without the guard, header='' trips neither limb of the schema predicate, the
  // LEGACY branch is silently taken, and a blank header line is written above
  // 10-column rows — after which readManifest promotes the first agent row to be
  // the header and one agent disappears.
  for (const [label, content] of [
    ['0-byte', ''],
    ['whitespace-only', '   \n\n  \n'],
  ]) {
    it(`treats a ${label} manifest as absent, not as a legacy header`, async () => {
      const mp = manifestPathIn(root);
      await fs.ensureDir(path.dirname(mp));
      await fs.writeFile(mp, content, 'utf8');

      await generateAgentManifest(root, { excluded: NO_EXCLUSIONS });
      const lines = (await fs.readFile(mp, 'utf8')).split('\n');

      assert.equal(lines[0], V610_HEADER, 'header must not be blank');
      assert.notEqual(lines[0].trim(), '', 'a blank header is the defect this guards');
      // v6.1.0 rows carry 12 columns; the legacy branch would have emitted 10.
      const bmeLine = lines.find(l => l.includes('"bme"'));
      assert.ok(bmeLine, 'expected generated bme rows');
      assert.equal(bmeLine.split('","').length, 12, 'must take the v6.1.0 branch, not legacy');
    });
  }

  it('collapses a newline in a persona field so rows cannot multiply across runs', async () => {
    await seedManifest(root, V610_HEADER, V610_FOREIGN_ROWS);
    const multiline = {
      id: 'gen11-multiline',
      name: 'Multi',
      title: 'T',
      icon: '🧪',
      persona: {
        role: 'r',
        identity: 'line one\nline two',
        communication_style: 's',
        expertise: 'e',
      },
    };
    const registry = { AGENTS: [multiline], GYRE_AGENTS: [], EXTRA_BME_AGENTS: [] };

    await generateAgentManifest(root, { excluded: NO_EXCLUSIONS, registry });
    const first = await fs.readFile(manifestPathIn(root), 'utf8');
    await generateAgentManifest(root, { excluded: NO_EXCLUSIONS, registry });
    const second = await fs.readFile(manifestPathIn(root), 'utf8');

    assert.equal(second, first, 'generation must be idempotent — rows must not accumulate');
    const count = second.split('\n').filter(l => l.includes('gen11-multiline')).length;
    assert.equal(count, 1, 'exactly one row per agent, however its persona is written');
  });

  it('does not throw on a partially-specified options object', async () => {
    await seedManifest(root, V610_HEADER, V610_FOREIGN_ROWS);
    // Both live callers pass complete objects; this is the API contract holding
    // rather than a live bug. readExcludedAgents is written never to throw, and
    // folding two locals into one options object must not undo that.
    await generateAgentManifest(root, { excluded: { vortex: [] } });
    await generateAgentManifest(root, { excluded: {} });
    await generateAgentManifest(root, { registry: { AGENTS: [] }, excluded: NO_EXCLUSIONS });
    const out = await fs.readFile(manifestPathIn(root), 'utf8');
    assert.ok(out.includes('bmad-agent-pm'), 'foreign rows survive every partial-options call');
  });

  it('honours non-empty excluded_agents when they are passed in', async () => {
    await seedManifest(root, V610_HEADER, V610_FOREIGN_ROWS);
    const { AGENTS } = require('../../scripts/update/lib/agent-registry');
    const excludedId = AGENTS[0].id;

    await generateAgentManifest(root, {
      excluded: { vortex: [excludedId], gyre: [] },
    });
    const out = await fs.readFile(manifestPathIn(root), 'utf8');

    assert.ok(
      !out.includes(`bmad-agent-bme-${excludedId}`),
      'an excluded agent must not appear in the manifest'
    );
    assert.ok(out.includes('"bme"'), 'other bme rows must still be generated');
  });

  // The CLI entry calls generateAgentManifest(root) with NO `excluded`, so it takes
  // the readExclusions() path and reads both config.yaml files off the target tree.
  // refreshInstallation passes its own lists and never exercises this, so without
  // this test the entry's actual exclusion path has no coverage at all.
  it('reads excluded_agents off the target tree when none are passed', async () => {
    await seedManifest(root, V610_HEADER, V610_FOREIGN_ROWS);
    const { AGENTS, GYRE_AGENTS } = require('../../scripts/update/lib/agent-registry');
    const vortexId = AGENTS[0].id;
    const gyreId = GYRE_AGENTS[0].id;

    const yaml = require('js-yaml');
    for (const [submodule, excluded] of [['_vortex', [vortexId]], ['_gyre', [gyreId]]]) {
      const cfgDir = path.join(root, '_bmad', 'bme', submodule);
      await fs.ensureDir(cfgDir);
      await fs.writeFile(
        path.join(cfgDir, 'config.yaml'),
        yaml.dump({ excluded_agents: excluded }),
        'utf8'
      );
    }

    await generateAgentManifest(root); // no `excluded` — must read the tree
    const out = await fs.readFile(manifestPathIn(root), 'utf8');

    assert.ok(
      !out.includes(`bmad-agent-bme-${vortexId}`),
      'a Vortex agent excluded in the target tree must not appear'
    );
    assert.ok(
      !out.includes(`bmad-agent-bme-${gyreId}`),
      'a Gyre agent excluded in the target tree must not appear'
    );
    assert.ok(out.includes('"bme"'), 'non-excluded bme rows must still be generated');
  });
});

// =========================================================================
// AC5 — registry-driven against an arbitrary target
// =========================================================================

describe('gen-1.1 AC5 — injected registry propagates to a temp projectRoot', () => {
  let root;

  beforeEach(async () => {
    root = await tmpRoot();
    await seedManifest(root, V610_HEADER, V610_FOREIGN_ROWS);
  });
  afterEach(async () => {
    await fs.remove(root);
  });

  it('writes a newly-injected agent into the target manifest', async () => {
    const injected = {
      id: 'gen11-probe-agent',
      name: 'Probe',
      title: 'Injected Probe Agent',
      icon: '🔬',
      persona: {
        role: 'probe role',
        identity: 'probe identity',
        communication_style: 'probe style',
        expertise: 'probe expertise',
      },
    };

    await generateAgentManifest(root, {
      excluded: NO_EXCLUSIONS,
      registry: { AGENTS: [injected], GYRE_AGENTS: [], EXTRA_BME_AGENTS: [] },
    });
    const out = await fs.readFile(manifestPathIn(root), 'utf8');

    assert.ok(
      out.includes('bmad-agent-bme-gen11-probe-agent'),
      'a registry change must reach the target manifest'
    );
    assert.ok(
      out.includes('_bmad/bme/_vortex/agents/gen11-probe-agent/SKILL.md'),
      'Vortex agents keep the skill-dir path shape'
    );
    // The target tree, not the registry, still owns the foreign rows.
    assert.ok(out.includes('bmad-agent-pm'), 'foreign rows survive an injected registry');
  });
});

// =========================================================================
// AC4 — refreshInstallation no longer writes to PACKAGE_ROOT's manifest
// =========================================================================

describe('gen-1.1 AC4 — refreshInstallation(PACKAGE_ROOT) performs no manifest write', () => {
  let writes;
  let realWriteFile;
  const realManifest = manifestPathIn(PACKAGE_ROOT);

  before(() => {
    // Assert on the WRITE OP, not on content and not on mtime. Content cannot see
    // the defect (generator output is byte-identical to the committed file, so the
    // write leaves git clean) and mtime is racy under a parallel runner.
    realWriteFile = fs.writeFile;
    fs.writeFile = function (p, ...rest) {
      if (String(p) === realManifest) writes.push(String(p));
      return realWriteFile.call(this, p, ...rest);
    };
  });

  after(() => {
    fs.writeFile = realWriteFile;
  });

  beforeEach(() => {
    writes = [];
    silenceConsole();
  });
  afterEach(() => {
    restoreConsole();
  });

  it('does not write the tracked manifest, and says so in changes', async () => {
    const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
    const changes = await refreshInstallation(PACKAGE_ROOT, { verbose: false });

    assert.equal(writes.length, 0, 'refreshInstallation must not write PACKAGE_ROOT/agent-manifest.csv');
    assert.ok(
      changes.includes(SKIP_MESSAGE),
      'the guarded branch must report the skip, not stay silent'
    );
    assert.ok(
      !changes.includes(CHANGE_MESSAGE),
      'the regeneration message must not appear when the write was skipped'
    );
  });
});

// =========================================================================
// AC1(ii) — the entry is wired
// =========================================================================

describe('gen-1.1 AC1(ii) — the deliberate path is reachable', () => {
  const pkg = require('../../package.json');

  it('package.json declares generate:manifest', () => {
    assert.ok(pkg.scripts['generate:manifest'], 'npm run generate:manifest must exist');
  });

  it('the script names a file that exists', () => {
    const script = pkg.scripts['generate:manifest'];
    const match = script.match(/node\s+(\S+)/);
    assert.ok(match, `cannot parse an entry path out of: ${script}`);
    assert.ok(
      fs.existsSync(path.join(PACKAGE_ROOT, match[1])),
      `entry named by generate:manifest does not exist: ${match[1]}`
    );
  });

  it('the entry calls the extracted module — one implementation, two callers (AC2)', () => {
    const src = fs.readFileSync(path.join(PACKAGE_ROOT, 'scripts/generate-manifest.js'), 'utf8');
    assert.match(src, /require\(['"]\.\/lib\/agent-manifest-generator['"]\)/);

    const refreshSrc = fs.readFileSync(
      path.join(PACKAGE_ROOT, 'scripts/update/lib/refresh-installation.js'),
      'utf8'
    );
    assert.match(refreshSrc, /require\(['"]\.\.\/\.\.\/lib\/agent-manifest-generator['"]\)/);
  });

  it('does not add a bin entry — the command is repo-local, not a consumer CLI', () => {
    assert.ok(
      !Object.values(pkg.bin || {}).some(v => String(v).includes('generate-manifest')),
      'generate-manifest must not be exposed as a bin'
    );
  });
});

// =========================================================================
// AC7 — the entry refuses to run from an installed copy
// =========================================================================

describe('gen-1.1 AC7 — refusal outside a development checkout', () => {
  it('refuses when the package root sits inside node_modules', () => {
    const verdict = checkDevelopmentCheckout(
      path.join(os.tmpdir(), 'anywhere', 'node_modules', 'convoke-agents')
    );
    assert.equal(verdict.ok, false);
    assert.match(verdict.reason, /installed copy/);
  });

  it('refuses a global-style install path too', () => {
    // Built with path.join so the segment split works on Windows too. A hardcoded
    // POSIX literal splits to ONE segment under path.sep='\\', so the node_modules
    // branch is never reached and the test would pass only because package.json is
    // unreadable there — asserting the reason is what closes that.
    const verdict = checkDevelopmentCheckout(
      path.join(path.sep, 'usr', 'local', 'lib', 'node_modules', 'convoke-agents')
    );
    assert.equal(verdict.ok, false);
    assert.match(verdict.reason, /installed copy/, 'must refuse for the node_modules reason');
  });

  it('allows this checkout', () => {
    assert.deepEqual(checkDevelopmentCheckout(PACKAGE_ROOT), { ok: true });
  });

  // Cleanup in a hook, not inline: an inline `await fs.remove(root)` after the
  // assertions is skipped when an assertion throws, orphaning the temp dir.
  describe('filesystem-backed refusals', () => {
    let root;
    beforeEach(async () => {
      root = await tmpRoot();
    });
    afterEach(async () => {
      await fs.remove(root);
    });

    it('refuses a directory whose package.json is not convoke-agents', async () => {
      await fs.writeJson(path.join(root, 'package.json'), { name: 'something-else' });
      const verdict = checkDevelopmentCheckout(root);
      assert.equal(verdict.ok, false);
      assert.match(verdict.reason, /not convoke-agents/);
    });

    it('refuses a directory with no package.json, without throwing', () => {
      const verdict = checkDevelopmentCheckout(root);
      assert.equal(verdict.ok, false);
      assert.match(verdict.reason, /cannot read/);
    });

    it('refuses a package.json that parses to null, without crashing', async () => {
      await fs.writeFile(path.join(root, 'package.json'), 'null', 'utf8');
      const verdict = checkDevelopmentCheckout(root);
      assert.equal(verdict.ok, false);
      assert.match(verdict.reason, /not convoke-agents/);
    });
  });

  // End-to-end: the real entry, in a real node_modules-shaped tree, asserting the
  // exit code AND the message. Exit code alone cannot tell a refusal from a crash.
  describe('spawned from a packed-install fixture', () => {
    let fixture;
    let entry;

    before(async () => {
      fixture = await tmpRoot();
      const pkgDir = path.join(fixture, 'node_modules', 'convoke-agents');
      await fs.ensureDir(pkgDir);
      await fs.copy(path.join(PACKAGE_ROOT, 'scripts'), path.join(pkgDir, 'scripts'));
      await fs.copy(
        path.join(PACKAGE_ROOT, 'package.json'),
        path.join(pkgDir, 'package.json')
      );
      // Give the fixture the markers a consumer project genuinely has — `_bmad/`
      // (they installed Convoke) and `tests/`. An earlier design keyed the guard on
      // `tests/` being absent from the tarball, which is not the same as it being
      // present only in this repo; this fixture is the shape that broke it.
      await fs.ensureDir(path.join(fixture, 'tests'));
      await fs.ensureDir(path.join(fixture, '_bmad', '_config'));
      await fs.ensureDir(path.join(pkgDir, '_bmad', '_config'));
      entry = path.join(pkgDir, 'scripts', 'generate-manifest.js');
    });

    after(async () => {
      await fs.remove(fixture);
    });

    it('exits non-zero with a REFUSED message, and writes nothing', async () => {
      const result = await new Promise(resolve => {
        execFile(
          process.execPath,
          [entry],
          {
            cwd: fixture,
            env: { ...process.env, NODE_PATH: path.join(PACKAGE_ROOT, 'node_modules') },
          },
          (err, stdout, stderr) => resolve({ code: err ? err.code : 0, stdout, stderr })
        );
      });

      assert.notEqual(result.code, 0, 'must exit non-zero');
      assert.match(result.stderr, /REFUSED/, 'must name the refusal, not emit a stack trace');
      assert.doesNotMatch(result.stderr, /TypeError|ERR_INVALID_ARG_TYPE/, 'must not crash');
      assert.equal(
        fs.existsSync(manifestPathIn(path.join(fixture, 'node_modules', 'convoke-agents'))),
        false,
        'the refused run must not have created a manifest'
      );
    });
  });
});
