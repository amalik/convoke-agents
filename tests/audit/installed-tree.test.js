'use strict';

/**
 * Tests for the FR13 installed-tree assertion (story dist-2.4).
 *
 * WHY THESE ARE NOT OPTIONAL
 * --------------------------
 * `try-fresh-install.sh` has shipped at least four checks that reported PASS while doing
 * nothing — a bin loop that could not fail for a MISSING bin, a `set -u` abort that bash
 * reported as exit 0, a `for`-list command substitution that made the loop run zero times,
 * and a `2>/dev/null` that turned any extractor crash into the pass value. AC7 exists
 * because of that table: every assertion added here is shown failing on a deliberately
 * broken input AND passing on a good one, in both directions, before it is believed.
 *
 * `test-fixture-isolation`: every case builds its own tmp tree. Nothing reads PACKAGE_ROOT
 * except the citation-rot tests, which are ABOUT this repository's source and say so.
 */

const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { PACKAGE_ROOT, removeTempDirSync } = require('../helpers');

const {
  RUNTIME_DATA_FILES,
  WRAPPER_RULES,
  shippedBmeModules,
  missingModules,
  missingRuntimeFiles,
  declaredUnits,
  missingWrappers,
  modulesWithoutConfig,
  unparsableConfigs,
  walkRequires,
} = require('../../scripts/audit/lib/installed-tree');

const CLI = path.join(PACKAGE_ROOT, 'scripts', 'audit', 'assert-installed-tree.js');

const created = [];
function tmp(prefix = 'convoke-tree-') {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  created.push(d);
  return d;
}
after(() => { while (created.length) removeTempDirSync(created.pop()); });

function write(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body, 'utf8');
}

// ─── AC4: the manifest is real and its citations still resolve ───

describe('RUNTIME_DATA_FILES — the curated manifest', () => {
  it('is non-empty (an empty list is a check that cannot fail)', () => {
    assert.ok(RUNTIME_DATA_FILES.length > 0);
  });

  it('names bmm-dependencies.csv, which the story\'s red demonstration depends on', () => {
    assert.ok(RUNTIME_DATA_FILES.some(e => e.file === '_bmad/_config/bmm-dependencies.csv'));
  });

  it('gives every entry a file, a read site and a reason', () => {
    for (const e of RUNTIME_DATA_FILES) {
      assert.match(e.file, /^_bmad\//, `${e.file} is not a project-relative _bmad path`);
      assert.match(e.readSite, /^scripts\/.+:\d+$/, `${e.file} has no <path>:<line> read site`);
      assert.ok(e.why && e.why.length > 20, `${e.file} has no stated reason`);
    }
  });

  // THE ROT ALARM. Curation is weaker than derivation and this is the compensating
  // control: if someone moves the code that reads one of these files, the citation
  // stops resolving and this fails, rather than the manifest quietly going stale.
  it('every cited call site exists and that exact line still mentions the file', () => {
    const sites = RUNTIME_DATA_FILES.flatMap(e =>
      [e.readSite, ...(e.alsoRead || []), ...(e.arrivesVia ? [e.arrivesVia] : [])].map(s => ({ site: s, entry: e }))
    );
    assert.ok(sites.length >= RUNTIME_DATA_FILES.length);
    for (const { site, entry } of sites) {
      const [rel, lineNo] = site.split(':');
      const abs = path.join(PACKAGE_ROOT, rel);
      assert.ok(fs.existsSync(abs), `${site} — file no longer exists`);
      const lines = fs.readFileSync(abs, 'utf8').split('\n');
      const line = lines[Number(lineNo) - 1];
      assert.ok(line !== undefined, `${site} — file has only ${lines.length} lines`);
      // The basename, or the CONSTANT that holds it: convoke-doctor.js:763 reads
      // `path.join(projectRoot, BMM_DEPS_CSV_REL)`, so the filename is not on the line.
      // That indirection is precisely why AC4 is a declared list and not a grep.
      const base = path.basename(entry.file);
      assert.ok(
        line.includes(base) || (entry.token && line.includes(entry.token)),
        `${site} no longer mentions ${base}${entry.token ? ` nor ${entry.token}` : ''} — line reads: ${line.trim()}`
      );
    }
  });
});

describe('WRAPPER_RULES — the generator call sites this check mirrors', () => {
  it('every rule cites a line in refresh-installation.js that is still there', () => {
    for (const [rule, def] of Object.entries(WRAPPER_RULES)) {
      const [rel, lineNo] = def.site.split(':');
      const abs = path.join(PACKAGE_ROOT, rel);
      assert.ok(fs.existsSync(abs), `${rule}: ${def.site} — file gone`);
      const lines = fs.readFileSync(abs, 'utf8').split('\n');
      assert.ok(lines[Number(lineNo) - 1] !== undefined, `${rule}: ${def.site} — past end of file`);
      assert.equal(typeof def.name, 'function');
    }
  });

  it('names wrappers the way each generator does', () => {
    assert.equal(WRAPPER_RULES.vortexAgent.name('emma'), 'bmad-agent-bme-emma');
    assert.equal(WRAPPER_RULES.enhanceWorkflow.name('initiatives-backlog'), 'bmad-enhance-initiatives-backlog');
    assert.equal(WRAPPER_RULES.standaloneWorkflow.name('bmad-portfolio-status'), 'bmad-portfolio-status');
  });
});

// ─── AC3 first half: modules in files[] arrive ───

describe('shippedBmeModules', () => {
  it('extracts bme module names and ignores everything else', () => {
    assert.deepEqual(
      shippedBmeModules(['index.js', 'scripts/', '_bmad/bme/_vortex/', '_bmad/bme/_portability/', '_bmad/_config/skill-manifest.csv']),
      ['_vortex', '_portability']
    );
  });
  it('is not fooled by a nested path or a non-array', () => {
    assert.deepEqual(shippedBmeModules(['_bmad/bme/_vortex/agents/']), []);
    assert.deepEqual(shippedBmeModules(undefined), []);
  });
});

describe('missingModules', () => {
  it('reports an absent module and stays quiet about a present one', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '_bmad', 'bme', '_vortex'), { recursive: true });
    assert.deepEqual(missingModules(['_vortex', '_portability'], root), ['_portability']);
    assert.deepEqual(missingModules(['_vortex'], root), []);
  });
});

// ─── AC4: runtime data files arrive ───

describe('missingRuntimeFiles', () => {
  it('fires on an absent file and clears when it is put there', () => {
    const root = tmp();
    const manifest = [{ file: '_bmad/_config/x.csv', readSite: 'scripts/a.js:1', why: 'x'.repeat(30) }];
    assert.equal(missingRuntimeFiles(root, manifest).length, 1);
    write(path.join(root, '_bmad', '_config', 'x.csv'), 'a\n');
    assert.equal(missingRuntimeFiles(root, manifest).length, 0);
  });

  it('does not accept a DIRECTORY where a file is required', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '_bmad', '_config', 'x.csv'), { recursive: true });
    assert.equal(missingRuntimeFiles(root, [{ file: '_bmad/_config/x.csv', readSite: 'scripts/a.js:1', why: 'x'.repeat(30) }]).length, 1);
  });
});

// ─── AC3 second half: declared units resolve to wrappers ───

function moduleFixture() {
  const root = tmp();
  const mk = (mod, cfg) => write(path.join(root, '_bmad', 'bme', mod, 'config.yaml'), cfg);
  mk('_vortex', 'version: 4.0.1\nworkflows:\n  - lean-persona\n  - product-vision\n');
  mk('_gyre', 'version: 4.0.1\nexcluded_agents:\n  - review-coach\nworkflows:\n  - gap-analysis\n');
  mk('_enhance', 'workflows:\n  - name: initiatives-backlog\n    entry: workflows/initiatives-backlog/workflow.md\n');
  mk('_artifacts', 'workflows:\n  - name: bmad-portfolio-status\n    standalone: true\n  - name: bmad-not-standalone\n');
  mk('_team-factory', 'version: 4.0.1\nworkflows:\n  - add-team\n');
  return root;
}

const REGISTRY = {
  AGENTS: [{ id: 'emma' }, { id: 'isla' }],
  GYRE_AGENTS: [{ id: 'review-coach' }, { id: 'stack-detective' }],
  EXTRA_BME_AGENTS: [{ id: 'team-factory', submodule: '_team-factory' }],
};

describe('declaredUnits', () => {
  const arrived = ['_vortex', '_gyre', '_enhance', '_artifacts', '_team-factory'];

  it('derives agents, honours excluded_agents, and skips string-shaped workflows', () => {
    const root = moduleFixture();
    const names = declaredUnits({ projectRoot: root, registry: REGISTRY, arrived }).map(u => u.name).sort();
    assert.deepEqual(names, [
      'bmad-agent-bme-emma',
      'bmad-agent-bme-isla',
      'bmad-agent-bme-stack-detective',   // review-coach is excluded in _gyre's config
      'bmad-agent-bme-team-factory',
      'bmad-enhance-initiatives-backlog', // no standalone flag — the Enhance path emits anyway
      'bmad-portfolio-status',            // standalone: true, name used verbatim
    ]);
    // The string-shaped workflows (lean-persona, gap-analysis, add-team) declare nothing,
    // and `bmad-not-standalone` is an object without the flag — neither reaches a generator.
    assert.ok(!names.includes('lean-persona'));
    assert.ok(!names.includes('bmad-not-standalone'));
  });

  it('ignores agents whose module did not arrive', () => {
    const root = moduleFixture();
    fs.rmSync(path.join(root, '_bmad', 'bme', '_gyre'), { recursive: true, force: true });
    const names = declaredUnits({ projectRoot: root, registry: REGISTRY, arrived: arrived.filter(m => m !== '_gyre') }).map(u => u.name);
    assert.ok(!names.includes('bmad-agent-bme-stack-detective'));
    assert.ok(names.includes('bmad-agent-bme-emma'));
  });

  // The load-bearing property: this must NOT be a snapshot. Story 2.6 gives _portability
  // a config.yaml with four standalone workflows, and this check has to pick them up
  // with no edit here — otherwise the wiring story ships against a stale expectation.
  it('picks up a module that gains standalone workflows, with no change to this code', () => {
    const root = moduleFixture();
    write(
      path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'),
      'version: 4.0.1\nworkflows:\n  - name: bmad-export-skill\n    standalone: true\n  - name: bmad-seed-catalog\n    standalone: true\n'
    );
    const names = declaredUnits({ projectRoot: root, registry: REGISTRY, arrived: [...arrived, '_portability'] }).map(u => u.name);
    assert.ok(names.includes('bmad-export-skill'));
    assert.ok(names.includes('bmad-seed-catalog'));
  });
});

describe('missingWrappers', () => {
  it('fires when a declared unit has no SKILL.md, and clears when it appears', () => {
    const root = tmp();
    const units = [{ name: 'bmad-agent-bme-emma', module: '_vortex', rule: 'vortexAgent', site: 'x:1' }];
    assert.equal(missingWrappers(units, root).length, 1);
    write(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma', 'SKILL.md'), '---\n');
    assert.equal(missingWrappers(units, root).length, 0);
  });

  it('does not accept an EMPTY skill DIRECTORY as a wrapper', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma'), { recursive: true });
    assert.equal(missingWrappers([{ name: 'bmad-agent-bme-emma', module: '_vortex', rule: 'v', site: 'x:1' }], root).length, 1);
  });
});

describe('modulesWithoutConfig — ADR-004 C1', () => {
  // THE REGRESSION THIS EXISTS FOR. Before C1 was asserted, a module directory copied
  // into the project with no config.yaml declared nothing, so the wrapper pass had
  // nothing to check and the whole run reported health — measured on a real installed
  // tree, exit 0, "6 shipped bme module(s) arrived, 15 declared unit(s) resolve", while
  // the module's skills were unreachable. Delete `modulesWithoutConfig` from the CLI and
  // the last case here goes green again.
  it('flags an arriving module with no config.yaml and clears when one is added', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '_bmad', 'bme', '_portability'), { recursive: true });
    assert.deepEqual(modulesWithoutConfig(['_portability'], root), ['_portability']);
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    assert.deepEqual(modulesWithoutConfig(['_portability'], root), []);
  });

  it('the CLI refuses a copied-but-unconfigured module rather than reporting health', () => {
    const { root, pkgRoot } = installedFixture();
    fs.mkdirSync(path.join(root, '_bmad', 'bme', '_portability'), { recursive: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1, 'a module that declares nothing must not pass by vacuity');
    assert.match(r.stdout, /_portability\/ arrived but carries no config\.yaml \(ADR-004 C1\)/);
  });
});

describe('unparsableConfigs', () => {
  it('names a module whose config.yaml does not parse', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_broken', 'config.yaml'), 'a:\n  - b\n c: [unclosed\n');
    const bad = unparsableConfigs(root, ['_broken']);
    assert.equal(bad.length, 1);
    assert.equal(bad[0].module, '_broken');
  });
});

// ─── AC5 / I153: the walk is transitive ───

describe('walkRequires', () => {
  it('follows relative requires TRANSITIVELY — the defect I153 records', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("./b");\n');
    write(path.join(root, 'b.js'), 'require("./gone");\n');
    const res = walkRequires(path.join(root, 'entry.js'));
    // A single-hop extractor reads entry.js only, finds `./a`, resolves it, and reports
    // clean. That is exactly `convoke-install`: one require, whole surface unchecked.
    assert.deepEqual(res.missing.map(m => m.spec), ['gone']
      .map(() => './gone'));
    assert.equal(res.visited, 3);
  });

  it('reports clean when the whole graph resolves', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("node:path");\n');
    assert.deepEqual(walkRequires(path.join(root, 'entry.js')).missing, []);
  });

  it('terminates on a cycle', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("./entry");\n');
    const res = walkRequires(path.join(root, 'entry.js'));
    assert.equal(res.visited, 2);
    assert.equal(res.capHit, false);
  });

  it('treats a bare package specifier as a leaf and does not walk into node_modules', () => {
    const root = tmp();
    write(path.join(root, 'node_modules', 'dep', 'package.json'), '{"name":"dep","main":"i.js"}');
    write(path.join(root, 'node_modules', 'dep', 'i.js'), 'require("./deep");\n');
    write(path.join(root, 'entry.js'), 'require("dep");\n');
    const res = walkRequires(path.join(root, 'entry.js'));
    // `dep/deep` is missing, but dep is third-party: not our packaging problem.
    assert.deepEqual(res.missing, []);
    assert.equal(res.visited, 1);
  });

  it('REPORTS the cap rather than passing silently', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("./b");\n');
    write(path.join(root, 'b.js'), 'require("./gone");\n');
    const res = walkRequires(path.join(root, 'entry.js'), { maxFiles: 2 });
    assert.equal(res.capHit, true);
    assert.ok(res.missing.length === 0, 'the walk stopped before reaching the defect — which is why capHit must be surfaced');
  });
});

// ─── AC7: the CLI fails on a broken tree and passes on a good one ───

function installedFixture() {
  const root = tmp();
  const pkgRoot = path.join(root, 'node_modules', 'convoke-agents');
  write(path.join(pkgRoot, 'package.json'), JSON.stringify({ name: 'convoke-agents', files: ['_bmad/bme/_vortex/', '_bmad/bme/_portability/'] }));
  write(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'),
    'module.exports = { AGENTS: [{ id: "emma" }], GYRE_AGENTS: [], EXTRA_BME_AGENTS: [] };\n');
  write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'), 'version: 4.0.1\nworkflows:\n  - lean-persona\n');
  write(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma', 'SKILL.md'), '---\n');
  for (const e of RUNTIME_DATA_FILES) write(path.join(root, e.file), 'x\n');
  return { root, pkgRoot };
}

function runCli(args) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return { code: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
}

describe('assert-installed-tree CLI', () => {
  it('exits 1 and names the module when a shipped module did not arrive', () => {
    const { root, pkgRoot } = installedFixture();   // _portability is declared, never created
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /FAILED: _bmad\/bme\/_portability\/ is in files\[\] but did not arrive/);
  });

  it('exits 1 and names the wrapper when a declared unit is not invocable', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    fs.rmSync(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma'), { recursive: true, force: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /declares bmad-agent-bme-emma but \.claude\/skills\/bmad-agent-bme-emma\/SKILL\.md was not generated/);
  });

  it('exits 1 and names the read site when a runtime data file did not arrive', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    const victim = RUNTIME_DATA_FILES[0];
    fs.rmSync(path.join(root, victim.file), { force: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.ok(r.stdout.includes(`FAILED: ${victim.file} is read at runtime by ${victim.readSite}`));
  });

  // The other direction. A check only shown failing might be failing for a reason that
  // has nothing to do with what it claims to measure.
  it('exits 0 on a tree where everything arrived', () => {
    const { root, pkgRoot } = installedFixture();
    // A conforming module: present AND carrying a config.yaml (ADR-004 C1).
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /2 shipped bme module\(s\) arrived, 1 declared unit\(s\) resolve/);
  });

  it('exits 2 — not 0 — when files[] declares no bme modules', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'package.json'), JSON.stringify({ name: 'convoke-agents', files: ['index.js'] }));
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /declares no _bmad\/bme\/\* entries/);
  });

  it('exits 2 on bad arguments and on a project root that does not exist', () => {
    assert.equal(runCli(['tree']).code, 2);
    assert.equal(runCli(['nonsense']).code, 2);
    const { pkgRoot } = installedFixture();
    assert.equal(runCli(['tree', path.join(os.tmpdir(), 'convoke-does-not-exist-xyz'), pkgRoot]).code, 2);
  });

  it('requires mode prints missing specifiers and exits 2 when it hits the cap', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("./gone");\n');
    const ok = runCli(['requires', path.join(root, 'entry.js')]);
    assert.equal(ok.code, 0);
    assert.equal(ok.stdout.trim(), './gone');
    const capped = runCli(['requires', path.join(root, 'entry.js'), '1']);
    assert.equal(capped.code, 2);
    assert.match(capped.stderr, /hit its 1-file cap/);
  });
});
