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
  modulesDeclaringNothing,
  unparsableConfigs,
  walkRequires,
} = require('../../scripts/audit/lib/installed-tree');

const CLI = path.join(PACKAGE_ROOT, 'scripts', 'audit', 'assert-installed-tree.js');

/**
 * The citation predicate. Defined ONCE and used by both the rot alarms and the guards that
 * prove those alarms discriminate.
 *
 * Round 2 found the previous arrangement failing in both directions. The alarm accepted
 * `basename || token` — an OR — so a citation carrying a token was still satisfied by any
 * line merely mentioning the file, and all three citations Round 1 had disproved passed when
 * reverted. And the guard meant to prove the alarm worked never invoked it, so deleting the
 * alarm's assertion left the suite fully green. An alarm and a guard that share no code
 * cannot check each other.
 *
 * `anchor` is what the line MUST contain. When one is given it is authoritative — the
 * basename is not an escape hatch, because the whole failure mode is a log line or a path
 * declaration that mentions the file without being the read or the write.
 */
/**
 * Run the citation alarm over {site, anchor} pairs; return those that failed.
 *
 * THE ALARM ITSELF, not a copy. The real citation tests and the guards that prove the alarm
 * discriminates both call this, so a mutation weakening it breaks the guards too. Round 2
 * caught the previous arrangement: the guard exercised its own inline logic while the alarm
 * inlined separate assertions, so deleting the alarm's assertion left the suite fully green.
 * An alarm and a guard that share no code cannot check each other — true twice in this file
 * before it was true once.
 */
function auditCitations(pairs) {
  return pairs.filter(({ site, anchor }) => !citationHolds(site, anchor));
}

function citationHolds(site, anchor) {
  const [rel, lineNo] = site.split(':');
  const abs = path.join(PACKAGE_ROOT, rel);
  if (!fs.existsSync(abs)) return false;
  const line = fs.readFileSync(abs, 'utf8').split('\n')[Number(lineNo) - 1];
  return line !== undefined && line.includes(anchor);
}

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
    // Each site carries the token that applies to IT, not a token pooled across the entry.
    // Round 1 review found three citations pointing at something other than the read or
    // write they claimed — a log line, an output-path constant on the WRITE side, and a
    // destination declaration — all of which passed because the old check accepted any line
    // merely mentioning the basename anywhere in the entry.
    const sites = RUNTIME_DATA_FILES.flatMap(e => [
      { site: e.readSite, entry: e, token: e.token },
      ...(e.alsoRead || []).map(s => ({ site: s, entry: e, token: e.alsoReadToken })),
      ...(e.arrivesVia ? [{ site: e.arrivesVia, entry: e, token: e.arrivesViaToken }] : []),
    ]);
    assert.ok(sites.length >= RUNTIME_DATA_FILES.length);
    for (const { site, entry, token } of sites) {
      const [rel, lineNo] = site.split(':');
      const abs = path.join(PACKAGE_ROOT, rel);
      assert.ok(fs.existsSync(abs), `${site} — file no longer exists`);
      const lines = fs.readFileSync(abs, 'utf8').split('\n');
      const line = lines[Number(lineNo) - 1];
      assert.ok(line !== undefined, `${site} — file has only ${lines.length} lines`);
      // The basename, or the CONSTANT that holds it: convoke-doctor.js:797 reads
      // `path.join(projectRoot, BMM_DEPS_CSV_REL)`, so the filename is not on the line.
      // That indirection is precisely why AC4 is a declared list and not a grep.
      // AND, not OR. A declared token is authoritative: `refresh-installation.js:1040` is a
      // `changes.push('Created …taxonomy.yaml…')` LOG line, so accepting the basename there
      // let the exact wrong citation Round 1 disproved pass again.
      const anchor = token || path.basename(entry.file);
      assert.deepEqual(
        auditCitations([{ site, anchor }]), [],
        `${site} no longer contains ${anchor} — line reads: ${line.trim()}`
      );
    }
  });
});

describe('WRAPPER_RULES — the generator call sites this check mirrors', () => {
  // THIS TEST WAS THE STORY'S OWN FIFTH FAIL-OPEN, and it is worth recording why rather
  // than quietly replacing it. The first version asserted only
  // `lines[Number(lineNo) - 1] !== undefined` — i.e. that refresh-installation.js has at
  // least N lines. Round 1 review proved it by mutation: rewriting the cited `:909` to `:1`
  // left the suite at 31 pass / 0 fail. Three of the five citations were ALREADY wrong when
  // it shipped (`:836` and `:909` were comments, `:862` was an `if` guard), and nothing
  // caught them. A working content-checking alarm for RUNTIME_DATA_FILES sat twenty lines
  // above it. Now it checks the anchor text, so a citation that drifts fails here.
  it('every rule cites a line that still holds its generator', () => {
    for (const [rule, def] of Object.entries(WRAPPER_RULES)) {
      const [rel, lineNo] = def.site.split(':');
      const abs = path.join(PACKAGE_ROOT, rel);
      assert.ok(fs.existsSync(abs), `${rule}: ${def.site} — file gone`);
      const lines = fs.readFileSync(abs, 'utf8').split('\n');
      const line = lines[Number(lineNo) - 1];
      assert.ok(line !== undefined, `${rule}: ${def.site} — past end of file`);
      assert.deepEqual(auditCitations([{ site: def.site, anchor: def.anchor }]), [],
        `${rule}: ${def.site} no longer contains "${def.anchor}" — line reads: ${line.trim()}`);
      assert.equal(typeof def.name, 'function');
      assert.ok(['generator', 'ADR-004 C2'].includes(def.derivedFrom), `${rule}: unstated basis`);
    }
  });

  // Guards that the alarm DISCRIMINATES, by running the same predicate the alarm runs
  // against citations known to be wrong. The previous version of this test asserted facts
  // about line 1 and never invoked the predicate at all, so deleting the alarm's assertion
  // left the suite green — the Round 1 defect class reproduced one level up.
  it('the citation predicate rejects the wrong lines, not just out-of-range ones', () => {
    const { site, anchor } = WRAPPER_RULES.standaloneWorkflow;
    assert.deepEqual(auditCitations([{ site, anchor }]), [], 'the real citation must hold, or the rest proves nothing');

    // In range, exists, and wrong — a bounds check passes all of these.
    const [rel] = site.split(':');
    assert.equal(auditCitations([{ site: `${rel}:1`, anchor }]).length, 1, 'line 1 is in range and must still be rejected');
    // `:913` is the `if (artifactsConfig && !isSameRoot)` GUARD immediately above the loop —
    // the exact off-by-one this story shipped twice.
    assert.equal(auditCitations([{ site: `${rel}:913`, anchor }]).length, 1, 'the guard line above the loop must be rejected');
  });

  // The same discrimination proof for the runtime-data manifest's alarm.
  it('the manifest alarm rejects a log line that merely mentions the filename', () => {
    const taxonomy = RUNTIME_DATA_FILES.find(e => e.file.endsWith('taxonomy.yaml'));
    assert.deepEqual(auditCitations([{ site: taxonomy.arrivesVia, anchor: taxonomy.arrivesViaToken }]), [], 'the real citation must hold');
    // `:1040` is `changes.push('Created _bmad/_config/taxonomy.yaml (platform defaults)')` —
    // it names the file and does not create it. This is the citation Round 1 disproved and
    // Round 2 found still passing.
    assert.equal(
      auditCitations([{ site: 'scripts/update/lib/refresh-installation.js:1040', anchor: taxonomy.arrivesViaToken }]).length, 1,
      'a log line naming the file must not satisfy the alarm'
    );
  });

  // The one rule that is NOT read off a generator, stated so the file cannot drift back to
  // claiming otherwise. There is no generic standalone-workflow generator — block 6d is
  // `if (artifactsConfig && !isSameRoot)` over `artifactsConfig.workflows`.
  it('is explicit that standaloneWorkflow comes from ADR-004 C2, not from a generator', () => {
    assert.equal(WRAPPER_RULES.standaloneWorkflow.derivedFrom, 'ADR-004 C2');
    for (const k of ['vortexAgent', 'gyreAgent', 'extraBmeAgent', 'enhanceWorkflow']) {
      assert.equal(WRAPPER_RULES[k].derivedFrom, 'generator', `${k} should be generator-derived`);
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
    // Spread: the return is an array carrying an `unresolvable` side-channel.
    assert.deepEqual(
      [...shippedBmeModules(['index.js', 'scripts/', '_bmad/bme/_vortex/', '_bmad/bme/_portability/', '_bmad/_config/skill-manifest.csv'])],
      ['_vortex', '_portability']
    );
  });
  it('is not fooled by a nested path or a non-array', () => {
    assert.deepEqual([...shippedBmeModules(['_bmad/bme/_vortex/agents/'])], []);
    assert.deepEqual([...shippedBmeModules(undefined)], []);
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
    const names = declaredUnits({ projectRoot: root, registry: REGISTRY, arrived }).units.map(u => u.name).sort();
    assert.deepEqual(names, [
      'bmad-agent-bme-emma',
      'bmad-agent-bme-isla',
      'bmad-agent-bme-stack-detective',   // review-coach is excluded in _gyre's config
      'bmad-agent-bme-team-factory',      // EXTRA_BME honours NO exclusions — see below
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
    const names = declaredUnits({ projectRoot: root, registry: REGISTRY, arrived: arrived.filter(m => m !== '_gyre') }).units.map(u => u.name);
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
    const names = declaredUnits({ projectRoot: root, registry: REGISTRY, arrived: [...arrived, '_portability'] }).units.map(u => u.name);
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

describe('modulesDeclaringNothing — the second form of the C1 vacuity', () => {
  // Round 1 review MEASURED this: `config.yaml` holding only `version: 4.0.1` passed the
  // file check, the parse check, and contributed zero units — so the wrapper pass had
  // nothing to check and the run reported `exit 0` on a `_portability` with four skills on
  // disk that no operator can invoke. Identical consequence to the hole C1 was added for.
  it('flags a module that has a config.yaml but declares nothing', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    const byModule = { _portability: { declared: 0, excluded: 0 } };
    assert.deepEqual(modulesDeclaringNothing(['_portability'], byModule, root), ['_portability']);
  });

  it('stays quiet once the module declares a unit', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    assert.deepEqual(modulesDeclaringNothing(['_portability'], { _portability: { declared: 1, excluded: 0 } }, root), []);
  });

  // Round 2: a supported operator opt-out was being reported as a packaging defect.
  it('does NOT fire when the module declared nothing because the operator excluded everything', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_gyre', 'config.yaml'), 'version: 4.0.1\nexcluded_agents:\n  - review-coach\n');
    assert.deepEqual(modulesDeclaringNothing(['_gyre'], { _gyre: { declared: 0, excluded: 2 } }, root), []);
  });

  // Round 2: an unparsable config produced TWO findings, the second of them untrue.
  it('leaves an unparsable config to unparsableConfigs rather than reporting it twice', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_broken', 'config.yaml'), 'a:\n  - b\n c: [unclosed\n');
    assert.deepEqual(modulesDeclaringNothing(['_broken'], { _broken: { declared: 0, excluded: 0 } }, root), []);
    assert.equal(unparsableConfigs(root, ['_broken']).length, 1);
  });

  it('does not double-report a module that has no config at all', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '_bmad', 'bme', '_portability'), { recursive: true });
    assert.deepEqual(modulesDeclaringNothing(['_portability'], { _portability: { declared: 0, excluded: 0 } }, root), []);
    assert.deepEqual(modulesWithoutConfig(['_portability'], root), ['_portability']);
  });

  it('the CLI refuses the empty-config tree that used to exit 0', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1, 'this exact tree exited 0 before Round 1');
    assert.match(r.stdout, /_portability\/ arrived and carries a config\.yaml but declares no invocable unit/);
  });
});

describe('zero units — a packaging regression is not an environment failure', () => {
  // All three review layers raised this. When NO module arrives, the run printed the
  // correct FAILED lines and then exited 2 (`ENV_FAIL`), so the maximal product defect this
  // check exists to catch was filed as "the environment failed us" — and, in the harness,
  // aborted before `COMPLETED=1` so the verdict never printed.
  it('exits 1, not 2, when the units are zero BECAUSE no module arrived', () => {
    const { root, pkgRoot } = installedFixture();
    fs.rmSync(path.join(root, '_bmad', 'bme', '_vortex'), { recursive: true, force: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1, 'a total arrival failure is a product defect');
    assert.match(r.stdout, /_bmad\/bme\/_vortex\/ is in files\[\] but did not arrive/);
    assert.doesNotMatch(r.stderr, /derivation failed/);
  });

  // REPLACED after Round 2. This case previously asserted exit 2 with EMPTY stdout — which
  // was the bug: the ADR-004 C1 second-form check sat below the early return and could never
  // run in the one situation it was added for. Exit 2 is now reserved for PHASE 1, where no
  // finding can yet have been gathered.
  it('exits 1 and names every vacuous module, instead of exiting 2 with nothing printed', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'),
      'module.exports = { AGENTS: [], GYRE_AGENTS: [], EXTRA_BME_AGENTS: [] };\n');
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1, 'a tree full of unreachable modules is a product defect');
    assert.match(r.stdout, /_vortex\/ arrived and carries a config\.yaml but declares no invocable unit/);
    assert.match(r.stdout, /_portability\/ arrived and carries a config\.yaml but declares no invocable unit/);
  });

  // Round 2: `scripts/` is in files[], so a registry that did not ship is a PRODUCT defect.
  // It previously exited 2, discarding findings already gathered.
  it('reports an unloadable shipped registry as a finding, keeping the other findings', () => {
    const { root, pkgRoot } = installedFixture();
    fs.rmSync(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'), { force: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /the shipped agent registry did not load/);
    assert.match(r.stdout, /_portability\/ is in files\[\] but did not arrive/, 'earlier findings must survive');
  });
});

describe('exclusions mirror the generator rather than a uniform rule', () => {
  // The generator excludes for Vortex (:783) and Gyre (:812) and NOT for EXTRA_BME (:837).
  // Filtering that bucket dropped a wrapper from the CHECK that the installer still emits.
  it('does NOT honour excluded_agents for the EXTRA_BME bucket', () => {
    const root = moduleFixture();
    write(path.join(root, '_bmad', 'bme', '_team-factory', 'config.yaml'),
      'version: 4.0.1\nexcluded_agents:\n  - team-factory\nworkflows:\n  - add-team\n');
    const { units } = declaredUnits({
      projectRoot: root, registry: REGISTRY,
      arrived: ['_vortex', '_gyre', '_enhance', '_artifacts', '_team-factory'],
    });
    assert.ok(units.map(u => u.name).includes('bmad-agent-bme-team-factory'),
      'the installer generates this wrapper regardless of excluded_agents, so the check must assert it');
  });

  it('reports a registry entry with no submodule instead of dropping it', () => {
    const root = moduleFixture();
    const { units, malformed } = declaredUnits({
      projectRoot: root,
      registry: { AGENTS: [], GYRE_AGENTS: [], EXTRA_BME_AGENTS: [{ id: 'orphan' }] },
      arrived: ['_vortex'],
    });
    assert.equal(units.filter(u => u.name.includes('orphan')).length, 0);
    assert.equal(malformed.length, 1);
    assert.equal(malformed[0].id, 'orphan');
  });
});

describe('wrapper and unit hygiene', () => {
  it('a zero-byte SKILL.md is not a wrapper', () => {
    const root = tmp();
    const units = [{ name: 'bmad-agent-bme-emma', module: '_vortex', rule: 'v', site: 'x:1' }];
    write(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma', 'SKILL.md'), '');
    assert.equal(missingWrappers(units, root).length, 1, 'an empty file is not invocable');
    write(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma', 'SKILL.md'), '---\n');
    assert.equal(missingWrappers(units, root).length, 0);
  });

  it('deduplicates units by wrapper name so one path is one assertion', () => {
    const root = moduleFixture();
    // Two modules declaring the same workflow name.
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'),
      'version: 4.0.1\nworkflows:\n  - name: bmad-portfolio-status\n    standalone: true\n');
    const { units } = declaredUnits({
      projectRoot: root, registry: REGISTRY,
      arrived: ['_vortex', '_gyre', '_enhance', '_artifacts', '_team-factory', '_portability'],
    });
    const names = units.map(u => u.name);
    assert.equal(new Set(names).size, names.length, 'no duplicate wrapper names');
  });

  // Round 2: silently skipping shrank the expectation set with no diagnostic, so a run could
  // exit 0 having never looked at the globbed module.
  it('reports a glob entry rather than silently dropping it', () => {
    const r = shippedBmeModules(['_bmad/bme/*/', '_bmad/bme/_vortex/']);
    assert.deepEqual([...r], ['_vortex']);
    assert.deepEqual(r.unresolvable, ['_bmad/bme/*/']);
  });
});

describe('walkRequires reports WHICH file needs a missing specifier', () => {
  it('carries `from`, and treats the same specifier from two directories as two defects', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");require("./sub/b");\n');
    write(path.join(root, 'a.js'), 'require("./gone");\n');
    write(path.join(root, 'sub', 'b.js'), 'require("./gone");\n');
    const res = walkRequires(path.join(root, 'entry.js'));
    assert.equal(res.missing.length, 2, 'same spec, different directories, two real defects');
    const froms = res.missing.map(m => path.basename(m.from)).sort();
    assert.deepEqual(froms, ['a.js', 'b.js']);
  });
});

describe('Round 3 — fail-open paths the restructure left open', () => {
  // Each of these was reproduced by a review layer against the shipped code, and each is a
  // check that reported less than it found, or reported health it had not established.

  it('a crash in phases 2-4 still emits the findings gathered before it', () => {
    const { root, pkgRoot } = installedFixture();
    // A legal-JS registry with a non-iterable AGENTS — `|| []` only rescues falsy values.
    write(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'),
      'module.exports = { AGENTS: { emma: {} }, GYRE_AGENTS: [], EXTRA_BME_AGENTS: [] };\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 2, 'a crash means the run was incomplete');
    assert.match(r.stdout, /_portability\/ is in files\[\] but did not arrive/,
      'the finding gathered before the crash must survive it');
  });

  it('the operator excluded_agents opt-out is not reported as a defect', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'package.json'),
      JSON.stringify({ name: 'convoke-agents', files: ['_bmad/bme/_vortex/'] }));
    write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'),
      'version: 4.0.1\nexcluded_agents:\n  - emma\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.doesNotMatch(r.stdout, /derivation/, 'the deleted zero-unit alarm must not come back');
  });

  it('reports a multi-segment glob rather than dropping it', () => {
    const r = shippedBmeModules(['_bmad/bme/_vortex/', '_bmad/bme/**/*', '_bmad/bme/*/subdir/']);
    assert.deepEqual([...r], ['_vortex']);
    assert.deepEqual(r.unresolvable, ['_bmad/bme/**/*', '_bmad/bme/*/subdir/'],
      'a glob outside the last segment used to vanish with no diagnostic');
  });

  it('a duplicated files[] entry yields one module, not two verdicts', () => {
    const r = shippedBmeModules(['_bmad/bme/_portability/', '_bmad/bme/_portability', '_bmad/bme/_vortex/']);
    assert.deepEqual([...r], ['_portability', '_vortex']);
  });

  it('a duplicated files[] entry does not double-report an absent module', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'package.json'), JSON.stringify({
      name: 'convoke-agents', files: ['_bmad/bme/_vortex/', '_bmad/bme/_portability/', '_bmad/bme/_portability'],
    }));
    const r = runCli(['tree', root, pkgRoot]);
    const lines = r.stdout.split('\n').filter(l => l.includes('_portability/ is in files[] but did not arrive'));
    assert.equal(lines.length, 1, 'one module, one verdict');
  });

  it('the success line counts modules that ARRIVED, not modules declared', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'package.json'),
      JSON.stringify({ name: 'convoke-agents', files: ['_bmad/bme/_vortex/'] }));
    write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'), 'version: 4.0.1\nexcluded_agents:\n  - emma\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.match(r.stdout, /^\s*1 shipped bme module\(s\) arrived/m);
  });
});

describe('the auditor runs where the CI job runs — no repo node_modules', () => {
  // CI run 33323351907 took main red. `js-yaml` is a runtime dependency of convoke-agents, so
  // a bare require finds it in $REPO/node_modules on any developer machine — but the
  // `fresh-install` job deliberately runs NO `npm ci` ("the script needs no repo dependencies
  // (verified against a clean clone)"), so on the runner there is no $REPO/node_modules and
  // the auditor died mid-run. That is the "works in THIS repo" failure the whole harness
  // exists to catch, committed inside the harness itself.
  //
  // This test reproduces the runner: the scripts are COPIED to a tree with no node_modules and
  // executed from there, with js-yaml reachable only through the installed package root.
  function isolatedRepo() {
    const root = tmp('convoke-norepo-');
    fs.mkdirSync(path.join(root, 'scripts', 'audit', 'lib'), { recursive: true });
    fs.copyFileSync(CLI, path.join(root, 'scripts', 'audit', 'assert-installed-tree.js'));
    fs.copyFileSync(
      path.join(PACKAGE_ROOT, 'scripts', 'audit', 'lib', 'installed-tree.js'),
      path.join(root, 'scripts', 'audit', 'lib', 'installed-tree.js')
    );
    assert.ok(!fs.existsSync(path.join(root, 'node_modules')), 'the fixture must have no repo deps');
    return path.join(root, 'scripts', 'audit', 'assert-installed-tree.js');
  }

  it('resolves js-yaml from the installed package and completes the run', () => {
    const { root, pkgRoot } = installedFixture();
    // A real tarball install carries js-yaml under the package; mirror that.
    fs.cpSync(
      path.join(PACKAGE_ROOT, 'node_modules', 'js-yaml'),
      path.join(pkgRoot, 'node_modules', 'js-yaml'),
      { recursive: true }
    );
    write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'), 'version: 4.0.1\n');

    const cli = isolatedRepo();
    let res;
    try {
      const stdout = execFileSync(process.execPath, [cli, 'tree', root, pkgRoot], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      res = { code: 0, stdout, stderr: '' };
    } catch (err) {
      res = { code: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
    }
    assert.doesNotMatch(res.stderr, /js-yaml could not be loaded/, res.stderr);
    assert.doesNotMatch(res.stderr, /assertion crashed/, res.stderr);
    assert.notEqual(res.code, 2, 'the run must complete, not abort as a harness failure');
    assert.match(res.stdout, /_portability\/ is in files\[\] but did not arrive/);
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
    // A conforming module under BOTH forms of C1: it carries a config.yaml AND that config
    // declares an invocable unit, whose wrapper then has to exist. A config holding only
    // `version:` is the vacuity the second form closes — see the C1 suite above.
    write(
      path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'),
      'version: 4.0.1\nworkflows:\n  - name: bmad-export-skill\n    standalone: true\n'
    );
    write(path.join(root, '.claude', 'skills', 'bmad-export-skill', 'SKILL.md'), '---\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /2 shipped bme module\(s\) arrived, 2 declared unit\(s\) resolve/);
  });

  // Was exit 2. `files[]` losing its bme entries is the packaging regression this check
  // exists for — a finding about the artifact, not the instrument failing to start.
  it('exits 1 when files[] declares no bme modules — that is the regression, not a harness fault', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'package.json'), JSON.stringify({ name: 'convoke-agents', files: ['index.js'] }));
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /declares no _bmad\/bme\/\* entries in files\[\]/);
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
    // `from` is part of the contract now: across a transitive walk a bare `./gone` does not
    // say which of up to 500 files needs it. The old one-hop check could omit it honestly.
    assert.match(ok.stdout.trim(), /^\.\/gone \(from .*a\.js\)$/);
    // Outside an installed package the path stays absolute — no cwd dependence either way.
    assert.ok(path.isAbsolute(ok.stdout.trim().replace(/^.*\(from /, '').replace(/\)$/, '')));
    const capped = runCli(['requires', path.join(root, 'entry.js'), '1']);
    assert.equal(capped.code, 2);
    assert.match(capped.stderr, /hit its 1-file cap/);
  });
});
