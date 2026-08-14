'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const { execFileSync } = require('child_process');

const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const { checkModuleWorkflows, checkVersionConsistency } = require('../../scripts/convoke-doctor');

const REPO_ROOT = findProjectRoot();

// Backlog I137 — regression coverage for "a clean install reports itself broken".
//
// WHAT HAPPENED
// -------------
// An install-tarball smoke run by hand (`npm pack` -> install into a fresh project ->
// `convoke-install-vortex` -> `convoke-doctor`) showed a SUCCESSFUL install of 4.0.0-rc.1
// immediately failing its own health check with 3 errors and 2 warnings, one of which told the
// user to run a command that does not exist in their project. The install worked; the product
// said it didn't.
//
// HOW THIS FILE WAS WRONG THE FIRST TIME (code review 2026-08-14) — read before editing
// -------------------------------------------------------------------------------------
// Two failure modes, both caught by review, both worth not repeating:
//
// 1. SOURCE-TEXT ASSERTIONS. Two tests regex-matched `mergeTaxonomy(` and
//    `scDoc.set('version', version)` in refresh-installation.js. Review defeated both by
//    dead-branching the matched calls — `if (false) { await mergeTaxonomy(projectRoot); }` —
//    leaving the text present while the behaviour was gone. Both production fixes fully
//    disabled; all six tests still passed. Reproduced and confirmed before this rewrite.
//    They tested that code was WRITTEN, not that it WORKS.
//
// 2. RE-IMPLEMENTED PRODUCTION LOGIC. The workflow test resolved object-form config entries via
//    `wf.entry`. `checkModuleWorkflows` ignores `entry` and always uses
//    `workflows/<name>/workflow.md`, so the test verified a rule production does not have — and
//    passed while the real check failed.
//
// The fix for both: run the real `refreshInstallation()` into a temp project (~100 ms) and hand
// the files it produces to the REAL doctor checks. Where a production predicate exists, call it
// rather than restating it.

describe('fresh-install health (I137)', () => {
  // One real install, shared across the assertions below.
  let installDir;
  let changes;

  before(async () => {
    installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i137-install-'));
    changes = await refreshInstallation(installDir, { verbose: false, backupGuides: false });
  });

  after(() => {
    if (installDir) fs.rmSync(installDir, { recursive: true, force: true });
  });

  /** Installed modules in the shape `convoke-doctor` builds them: { name, dir, config }. */
  function installedModules(root) {
    const bmeDir = path.join(root, '_bmad', 'bme');
    if (!fs.existsSync(bmeDir)) return [];
    return fs
      .readdirSync(bmeDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => ({ name: e.name, dir: path.join(bmeDir, e.name) }))
      .filter((m) => fs.existsSync(path.join(m.dir, 'config.yaml')))
      .map((m) => ({
        ...m,
        config: yaml.load(fs.readFileSync(path.join(m.dir, 'config.yaml'), 'utf8')) || {},
      }));
  }

  it('a fresh install produces modules at all', () => {
    // Guard: every assertion below iterates installed modules. If the install silently produced
    // nothing, they would all pass vacuously.
    const mods = installedModules(installDir);
    assert.ok(
      mods.length > 0,
      `refreshInstallation produced no modules. changes: ${changes.join(' | ')}`
    );
  });

  it("the REAL doctor workflow check passes for every module a fresh install creates", () => {
    // The `add-team` defect: `_team-factory/config.yaml` declared `workflows: [add-team]`, the
    // directory shipped with five step files, and no `workflow.md` — which is what
    // `checkModuleWorkflows` requires. A clean install reported:
    //   ✗ _team-factory workflows — Missing: add-team
    const failures = installedModules(installDir)
      .map((mod) => checkModuleWorkflows(mod))
      .filter((r) => !r.passed)
      .map((r) => `${r.name}: ${r.error}`);
    assert.deepEqual(
      failures,
      [],
      `convoke-doctor reports workflow failures on a CLEAN install:\n  ${failures.join('\n  ')}`
    );
  });

  it('the REAL doctor version-consistency check passes on a fresh install', () => {
    // `_team-factory` was the only module tree copied without a config version stamp, so a clean
    // install of 4.0.0-rc.1 reported `_team-factory: 1.0.0` and told the user to immediately
    // update. Asserted against the installed OUTPUT, so dead-branching the stamp fails this.
    const result = checkVersionConsistency(installDir, installedModules(installDir));
    assert.equal(
      result.passed,
      true,
      `version consistency fails on a clean install: ${result.error}`
    );
  });

  it('a fresh install creates the artifact taxonomy', () => {
    // `mergeTaxonomy` was reachable only from two migrations. A fresh install runs no migrations,
    // so taxonomy.yaml was never created and doctor reported `✗ Taxonomy: file exists`, with a
    // fix telling the user to run an upgrade they had no reason to run.
    const taxonomyPath = path.join(installDir, '_bmad', '_config', 'taxonomy.yaml');
    assert.ok(fs.existsSync(taxonomyPath), 'taxonomy.yaml was not created by a fresh install');
    const parsed = yaml.load(fs.readFileSync(taxonomyPath, 'utf8'));
    assert.ok(parsed && parsed.initiatives, 'taxonomy.yaml exists but has no initiatives section');
    assert.ok(
      Array.isArray(parsed.initiatives.platform),
      'taxonomy.yaml has no platform initiatives'
    );
  });

  it('a fresh install seeds a usable skill-manifest.csv, and convoke-export works', () => {
    // Backlog I139. `convoke-export` is a shipped bin that reads every skill's content from the
    // `path` column of `_bmad/_config/skill-manifest.csv`. Nothing created that file and
    // `_bmad/_config/` was not in package.json `files`, so on a clean install the bin failed
    // outright with ENOENT — every export by every new user. It was invisible because doctor
    // reported it only as a ⚠ and still exited 0, and `--help` succeeded.
    const manifestPath = path.join(installDir, '_bmad', '_config', 'skill-manifest.csv');
    assert.ok(fs.existsSync(manifestPath), 'a fresh install produced no skill-manifest.csv');

    const { readManifest } = require('../../scripts/portability/manifest-csv');
    const { header, rows } = readManifest(manifestPath);
    assert.ok(rows.length > 0, 'seeded manifest has no rows — convoke-export would find nothing');

    // Every row must resolve. The package manifest is a CANDIDATE list of 106 rows, only ~19 of
    // which point at content Convoke ships; the rest are upstream BMAD modules the user may not
    // have. Seeding it verbatim would recreate backlog I123's trap, where most paths resolved to
    // nothing.
    const pathIdx = header.indexOf('path');
    const broken = rows
      .map((r) => r[pathIdx])
      .filter((rel) => !rel || !fs.existsSync(path.join(installDir, rel)));
    assert.deepEqual(broken, [], `seeded manifest rows point at content that is not installed:\n  ${broken.join('\n  ')}`);

    // No duplicates. Seeding re-serialised rows unquoted while the Enhance registration block
    // dedups with a QUOTED substring match (`skCsv.includes('"' + id + '"')`), so it missed the
    // seeded row and appended a second copy of bmad-enhance-initiatives-backlog. Found by reading
    // a seeded manifest, not by a test — hence this assertion.
    const idIdx = header.indexOf('canonicalId');
    const ids = rows.map((r) => r[idIdx]);
    const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    assert.deepEqual(dupes, [], `seeded manifest has duplicate rows: ${dupes.join(', ')}`);

    // The point of all of it: the shipped bin can actually export.
    const { exportSkill } = require('../../scripts/portability/export-engine');
    const result = exportSkill(ids[0], installDir);
    assert.ok(
      result && result.instructions && result.instructions.length > 0,
      `convoke-export produced nothing for "${ids[0]}" on a clean install`
    );
  });

  it('an UNUSABLE manifest is repaired, and a valid one is left alone', () => {
    // Code review 2026-08-14 asked whether "absent" was the right seeding trigger. It was not,
    // and the failure was worse than being stuck: `existsSync` is true for a 0-byte file, so an
    // empty manifest was never reseeded — and the Enhance block then APPENDED a row to it, which
    // `readManifest` read as the HEADER. Garbage columns, zero rows, convoke-export throwing
    // forever. Verified before the guard was widened.
    const { readManifest } = require('../../scripts/portability/manifest-csv');
    const rel = path.join('_bmad', '_config', 'skill-manifest.csv');

    const cases = [
      ['empty', '', true],
      ['garbage', 'not,a,manifest\njunk\n', true],
      // A manifest that PARSES with a valid header is user state, however few rows it has.
      ['header-only', '"canonicalId","name","description","module","path","install_to_bmad","tier","intent","dependencies"\n', false],
    ];

    for (const [label, seed, expectSalvage] of cases) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), `i139-${label}-`));
      try {
        fs.mkdirSync(path.join(dir, '_bmad', '_config'), { recursive: true });
        fs.writeFileSync(path.join(dir, rel), seed);
        // Only the seeding block matters here, so drive it via the same entry point.
        require('child_process').execFileSync(
          process.execPath,
          [
            '-e',
            `require(${JSON.stringify(path.join(REPO_ROOT, 'scripts/update/lib/refresh-installation.js'))})` +
              `.refreshInstallation(${JSON.stringify(dir)},{verbose:false,backupGuides:false})` +
              `.then(()=>process.exit(0),e=>{console.error(e);process.exit(1)})`,
          ],
          { stdio: 'pipe' }
        );
        const { header } = readManifest(path.join(dir, rel));
        assert.ok(
          header.includes('path'),
          `${label}: manifest still has no usable header after refresh — convoke-export stays broken`
        );
        const salvaged = fs
          .readdirSync(path.join(dir, '_bmad', '_config'))
          .filter((f) => f.includes('.corrupt-'));
        assert.equal(
          salvaged.length > 0,
          expectSalvage,
          expectSalvage
            ? `${label}: unusable manifest was replaced without being set aside (path-safety)`
            : `${label}: a VALID manifest was clobbered — that is user state`
        );
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  describe('remediation text must be runnable in a user project', () => {
    /**
     * Strip comments while tracking string/template state, so a `//` INSIDE a string is not
     * mistaken for a comment.
     *
     * The previous version filtered whole lines whose trimmed text began with `//`. Review found
     * three ways past it: a multi-line template literal (the quoted-string regex could not span
     * newlines), a comment-looking line that was really template content, and a message naming a
     * script with the same basename in a different directory.
     */
    function stripComments(src) {
      let out = '';
      let i = 0;
      const N = src.length;
      // Distinguish a REGEX LITERAL from a comment or division. Code review 2026-08-14 showed
      // `const sep = /\//;` was read as the start of a `//` comment, so everything after it on
      // that line — INCLUDING a real `node scripts/x.js` offender — was silently dropped. The
      // scanner hid exactly what it exists to find. Verified end-to-end before this fix.
      //
      // Standard heuristic: a `/` that follows an operator, an opening bracket, or nothing at all
      // starts a regex; a `/` following a value (identifier, literal, closing bracket) is division.
      const regexAllowedAfter = /[=(,:[!&|?{};+\-*%<>~^]$/;
      const lastMeaningful = () => {
        const t = out.replace(/\s+$/, '');
        return t.length ? t[t.length - 1] : '';
      };
      while (i < N) {
        const c = src[i];
        // Regex literal — consume it whole (including escaped slashes and char classes) so its
        // contents can never be mistaken for a comment, a string, or a path.
        if (c === '/' && src[i + 1] !== '/' && src[i + 1] !== '*') {
          const prev = lastMeaningful();
          if (prev === '' || regexAllowedAfter.test(prev)) {
            out += c;
            i++;
            let inClass = false;
            while (i < N) {
              if (src[i] === '\\') {
                out += src[i] + (src[i + 1] || '');
                i += 2;
                continue;
              }
              if (src[i] === '[') inClass = true;
              else if (src[i] === ']') inClass = false;
              const done = src[i] === '/' && !inClass;
              out += src[i];
              i++;
              if (done) break;
              if (src[i - 1] === '\n') break; // unterminated — bail rather than run away
            }
            continue;
          }
        }
        if (c === '/' && src[i + 1] === '/') {
          while (i < N && src[i] !== '\n') i++;
          continue;
        }
        if (c === '/' && src[i + 1] === '*') {
          i += 2;
          while (i < N && !(src[i] === '*' && src[i + 1] === '/')) i++;
          i += 2;
          continue;
        }
        if (c === "'" || c === '"' || c === '`') {
          const quote = c;
          out += c;
          i++;
          while (i < N) {
            if (src[i] === '\\') {
              out += src[i] + (src[i + 1] || '');
              i += 2;
              continue;
            }
            out += src[i];
            const done = src[i] === quote;
            i++;
            if (done) break;
          }
          continue;
        }
        out += c;
        i++;
      }
      return out;
    }

    function shippedScripts() {
      const found = [];
      (function walk(dir) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) {
            if (e.name !== 'node_modules') walk(full);
          } else if (e.name.endsWith('.js')) found.push(full);
        }
      })(path.join(REPO_ROOT, 'scripts'));
      return found;
    }

    it('stripComments does not let a regex literal hide an offender', () => {
      // The scanner's own blind spot, found by code review 2026-08-14: `const sep = /\\//;` was
      // read as the start of a `//` comment, so the rest of that line — including a real
      // `node scripts/x.js` string — was dropped. The scanner hid exactly what it exists to find.
      const cases = [
        ['escaped slash in regex', 'const sep = /\\//; log("node scripts/a.js");', true],
        ['url regex', 'const u = /https:\\/\\//; log("node scripts/b.js");', true],
        ['slash in char class', 'const c = /[/]/; log("node scripts/c.js");', true],
        ['division, not regex', 'const d = a / b; log("node scripts/d.js");', true],
        ['genuine line comment', '// node scripts/ignored.js', false],
        ['genuine block comment', '/* node scripts/ignored.js */', false],
      ];
      for (const [label, src, shouldSurvive] of cases) {
        assert.equal(
          /node\s+scripts\//.test(stripComments(src)),
          shouldSurvive,
          `stripComments mishandled: ${label}`
        );
      }
    });

    it('no shipped script tells a user to run a repo-relative path to a DIFFERENT script', () => {
      // 14 such strings shipped across convoke-doctor.js and convoke-update.js, all naming
      // `node scripts/audit/audit-bmm-dependencies.js` — a path absent from a user's project.
      //
      // A tool's own `Usage: node scripts/foo.js` line is fine: that is genuinely how it is
      // invoked from a checkout, and those tools are repo-internal. Comparison is on the FULL
      // relative path, not the basename — a same-named script in another directory is a
      // different script, and comparing basenames let that through.
      const offenders = [];
      for (const file of shippedScripts()) {
        const selfRel = path.relative(REPO_ROOT, file);
        const src = stripComments(fs.readFileSync(file, 'utf8'));
        for (const m of src.matchAll(/\bnode\s+(scripts\/[A-Za-z0-9_./-]+\.js)/g)) {
          if (m[1] === selfRel) continue; // self-usage
          offenders.push(`${selfRel} -> ${m[1]}`);
        }
      }
      assert.deepEqual(
        offenders,
        [],
        `script(s) tell the user to run a path that does not exist in their project. Expose the ` +
          `target as a bin and use "npx -p convoke-agents <bin>":\n  ${offenders.join('\n  ')}`
      );
    });

    it('every bin referenced by ANY shipped script is declared in package.json', () => {
      // Widened from convoke-doctor.js alone: the first version checked only doctor and passed
      // while convoke-update.js printed the same unrunnable command twice.
      const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
      const referenced = new Set();
      for (const file of shippedScripts()) {
        const src = stripComments(fs.readFileSync(file, 'utf8'));
        for (const m of src.matchAll(/npx -p convoke-agents ([a-z0-9-]+)/g)) referenced.add(m[1]);
      }
      assert.ok(referenced.size > 0, 'no npx remediations found — this test would pass vacuously');
      const undeclared = [...referenced].filter((b) => !pkg.bin[b]);
      assert.deepEqual(
        undeclared,
        [],
        `script(s) reference undeclared bin(s): ${undeclared.join(', ')}`
      );
    });
  });

  it('every declared bin exists, parses, and is a usable CLI', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    const broken = [];
    for (const [name, rel] of Object.entries(pkg.bin)) {
      const abs = path.join(REPO_ROOT, rel);
      if (!fs.existsSync(abs)) {
        broken.push(`${name} -> ${rel} (missing)`);
        continue;
      }
      const src = fs.readFileSync(abs, 'utf8');
      if (!src.startsWith('#!')) broken.push(`${name} -> ${rel} (no shebang)`);
      // Parse check. The previous version never parsed the file, so a bin with an outright
      // syntax error — the most basic way to not be "usable as a CLI" — passed.
      try {
        execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' });
      } catch (err) {
        const first = String(err.stderr || err.message).split('\n').find((l) => l.trim()) || '';
        broken.push(`${name} -> ${rel} (syntax error: ${first.trim()})`);
      }
      // A `require.main === module` guard is needed ONLY for a file that is also importable —
      // without it, `require()`ing the module runs the CLI as a side effect. Pure entry points
      // legitimately run at top level, so demanding it unconditionally is wrong: an earlier
      // version did, and reported five working bins as broken. `module.exports\b` rather than
      // `module.exports\s*=` so partial exports (`module.exports.foo = ...`) are covered too.
      if (/module\.exports\b/.test(src) && !src.includes('require.main === module')) {
        broken.push(`${name} -> ${rel} (exports a module but runs at top level)`);
      }
    }
    assert.deepEqual(broken, [], `declared bin(s) are not usable:\n  ${broken.join('\n  ')}`);
  });
});
