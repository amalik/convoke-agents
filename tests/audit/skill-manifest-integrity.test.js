'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { removeTempDirSync, initGitFixture } = require('../helpers');
const { writeManifest } = require('../../scripts/portability/manifest-csv');

const auditModule = require('../../scripts/audit/skill-manifest-integrity.js');

const {
  audit,
  resolveRoster,
  trackedSkillDirsAt,
  GitUnavailableError,
  META_PLATFORM_SKILLS,
  STANDALONE_UTILITIES,
  PERSONA_AGENTS,
  CIS_POLICY,
  RETIRED,
} = require('../../scripts/audit/skill-manifest-integrity.js');

// Fixture-bound tests for the skill-manifest lint, promoted out of
// `tests/lib/portability-classification.test.js` on 2026-09-05. That file read the LIVE
// tree via `findProjectRoot()` + `git ls-files`, violating `test-fixture-isolation`.
//
// The split: the live read now lives in `scripts/audit/skill-manifest-integrity.js` (a lint
// over a tracked governance artifact, alongside `backlog-integrity.js`), and these tests
// drive its pure `audit()` over synthetic data plus its git half over real temp repos.
//
// These tests ARE the falsifiability evidence `verification-must-be-falsifiable` asks for:
// each corrupts exactly one property and asserts the specific finding fires. A gate nobody
// has seen go red is not a gate.
//
// Round 1 (2026-09-05) proved that claim was FALSE for the git half — replacing
// `trackedSkillDirsAt`'s body with `return []` left all 25 tests green. The
// `trackedSkillDirsAt` describe block below exists so that mutation fails.

// The column contract and section list come FROM the audit, not from copies here
// (`shared-test-constants`). Round 1: both were hand-copied one line after the change that
// made importing them free.
const HEADER = [...auditModule.EXPECTED_HEADER_COLUMNS];

const NAME_IDX = HEADER.indexOf('name');

const mkRow = (name, tier, intent, deps = '') => [
  name,
  name,
  'description',
  'core',
  `_bmad/core/skills/${name}/SKILL.md`,
  'true',
  tier,
  intent,
  deps,
];

// Build a passing manifest FROM THE SCRIPT'S OWN CONSTANTS (`derive-counts-from-source`).
// Adding a name to a roster in the script must not require editing a literal here.
function validRows() {
  const rows = [];
  for (const n of META_PLATFORM_SKILLS) {
    if (RETIRED.metaPlatform.includes(n)) continue;
    rows.push(mkRow(n, 'pipeline', 'meta-platform'));
  }
  for (const [n, intent] of Object.entries(STANDALONE_UTILITIES)) {
    rows.push(mkRow(n, 'standalone', intent));
  }
  for (const n of PERSONA_AGENTS) {
    if (RETIRED.personaAgents.includes(n)) continue;
    rows.push(mkRow(n, 'standalone', 'define-what-to-build'));
  }
  for (const [n, policy] of Object.entries(CIS_POLICY)) {
    rows.push(mkRow(n, policy.tier ?? 'light-deps', policy.intent));
  }
  for (const n of ['bmad-testarch-ci', 'bmad-testarch-atdd', 'bmad-testarch-trace']) {
    rows.push(mkRow(n, 'standalone', 'test-your-code'));
  }
  return rows;
}

// Tracked skill dirs implied by a row set. Retired names are absent, which is the state
// `resolveRoster` treats as a legitimate upstream retirement.
const dirsFor = (rows) => rows.map((r) => `_bmad/core/skills/${r[NAME_IDX]}`);

const base = () => {
  const rows = validRows();
  return { header: HEADER, rows, trackedSkillDirs: dirsFor(rows) };
};

const ids = (findings) => findings.map((f) => f.id);
const rowFor = (rows, name) => rows.find((r) => r[NAME_IDX] === name);

const created = [];
afterEach(() => {
  // try/catch per entry: `removeTempDirSync` rethrows on the documented ENOTEMPTY /
  // detached-git-maintenance race, and `pop()` has already consumed the entry — without
  // this, one throw abandons every remaining directory. Round 1 finding. Every failure is
  // reported, not just the first, so a second leak cannot hide behind the first (Round 2).
  const errors = [];
  while (created.length) {
    const dir = created.pop();
    try {
      removeTempDirSync(dir);
    } catch (err) {
      errors.push(err);
    }
  }
  if (errors.length) {
    throw new AggregateError(errors, `${errors.length} temp dir(s) failed to clean up`);
  }
});

function tempDir() {
  // Sync mkdtemp: the helper's createTempDir is async, and these hooks are sync.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-manifest-audit-'));
  created.push(dir);
  return dir;
}

describe('audit — the happy path', () => {
  it('reports nothing on a well-formed, policy-conformant manifest', () => {
    const findings = audit(base());
    assert.deepEqual(findings, [], `expected clean, got: ${JSON.stringify(findings, null, 2)}`);
  });
});

describe('audit — row-level classification (each case proves the gate goes red)', () => {
  it('fires on an empty tier', () => {
    const input = base();
    rowFor(input.rows, 'bmad-help')[6] = '';
    assert.ok(ids(audit(input)).includes('row/unclassified'));
  });

  it('fires on an empty intent', () => {
    const input = base();
    rowFor(input.rows, 'bmad-help')[7] = '';
    assert.ok(ids(audit(input)).includes('row/unclassified'));
  });

  it('fires on a non-canonical tier', () => {
    const input = base();
    rowFor(input.rows, 'bmad-help')[6] = 'semi-standalone';
    assert.ok(ids(audit(input)).includes('row/invalid-tier'));
  });

  it('fires on a non-canonical intent', () => {
    const input = base();
    rowFor(input.rows, 'bmad-help')[7] = 'vibes';
    assert.ok(ids(audit(input)).includes('row/invalid-intent'));
  });

  it('fires on a missing header column, and stops before trusting the rows', () => {
    const input = base();
    input.header = HEADER.filter((c) => c !== 'intent');
    assert.deepEqual(ids(audit(input)), ['header/missing-column']);
  });

  it('fires on an empty manifest', () => {
    assert.ok(
      ids(audit({ header: HEADER, rows: [], trackedSkillDirs: ['_bmad/core/skills/x'] })).includes(
        'manifest/empty'
      )
    );
  });

  it('reports a short row instead of throwing, and keeps auditing the rest', () => {
    // A stray line (merge-conflict marker, hand-edit) used to throw a raw TypeError that
    // discarded every finding collected so far. Round 1 finding.
    const input = base();
    input.rows = [['orphan'], ...input.rows];
    let findings;
    assert.doesNotThrow(() => {
      findings = audit(input);
    });
    assert.deepEqual(ids(findings), ['row/malformed']);
  });

  it('fires on a duplicate name, which would otherwise be exempt from every check', () => {
    // `findRow` returns the FIRST match, so without this a misclassified duplicate audits
    // completely clean. Round 1 finding.
    const input = base();
    input.rows.push(mkRow('bmad-help', 'standalone', 'plan-your-work'));
    assert.ok(ids(audit(input)).includes('manifest/duplicate-name'));
  });
});

describe('audit — an enumeration that could not run is not a pass', () => {
  it('fires tracked-skills/empty when no skill dirs were found', () => {
    // The Round 1 mutation (`trackedSkillDirsAt` -> `return []`) left every gate green.
    // With no tracked dirs the retirement guard cannot run, so silence is not evidence.
    const input = base();
    input.trackedSkillDirs = [];
    assert.ok(ids(audit(input)).includes('tracked-skills/empty'));
  });
});

describe('audit — policy spot-checks', () => {
  it('fires when a meta-platform skill is not pipeline tier', () => {
    const input = base();
    rowFor(input.rows, 'bmad-help')[6] = 'standalone';
    assert.ok(ids(audit(input)).includes('meta-platform/tier'));
  });

  it('fires when a meta-platform skill loses its meta-platform intent', () => {
    const input = base();
    rowFor(input.rows, 'bmad-help')[7] = 'plan-your-work';
    assert.ok(ids(audit(input)).includes('meta-platform/intent'));
  });

  it('fires when a standalone utility is reclassified as meta-platform (AC #7 carve-out)', () => {
    const input = base();
    rowFor(input.rows, 'bmad-shard-doc')[7] = 'meta-platform';
    assert.ok(ids(audit(input)).includes('standalone-utility/intent'));
  });

  it('fires when a standalone utility is not standalone tier', () => {
    const input = base();
    rowFor(input.rows, 'bmad-shard-doc')[6] = 'light-deps';
    assert.ok(ids(audit(input)).includes('standalone-utility/tier'));
  });

  it('fires when a persona agent carries dependencies', () => {
    const input = base();
    rowFor(input.rows, 'bmad-agent-architect')[8] = 'bmad-help';
    assert.ok(ids(audit(input)).includes('persona-agent/deps'));
  });

  it('fires when a persona agent is not standalone', () => {
    const input = base();
    rowFor(input.rows, 'bmad-agent-architect')[6] = 'pipeline';
    assert.ok(ids(audit(input)).includes('persona-agent/tier'));
  });

  it('fires when a CIS skill loses its pinned intent', () => {
    const input = base();
    rowFor(input.rows, 'bmad-brainstorming')[7] = 'plan-your-work';
    assert.ok(ids(audit(input)).includes('cis/intent'));
  });

  it('fires when a CIS skill with a pinned tier drifts off it', () => {
    const input = base();
    rowFor(input.rows, 'bmad-brainstorming')[6] = 'light-deps';
    assert.ok(ids(audit(input)).includes('cis/tier'));
  });

  it('does NOT pin the tier of a CIS skill whose policy leaves it open', () => {
    // `bmad-cis-agent-storyteller` carries a sidecar memory file, so it is light-deps.
    const input = base();
    rowFor(input.rows, 'bmad-cis-agent-storyteller')[6] = 'standalone';
    assert.ok(!ids(audit(input)).includes('cis/tier'));
  });

  it('fires when a CIS skill has no row at all', () => {
    // Reported as `cis/roster-decay` since Round 2 routed CIS through `resolveRoster`:
    // an undeclared disappearance is decay, and a declared one goes in RETIRED.cis.
    const input = base();
    input.rows = input.rows.filter((r) => r[NAME_IDX] !== 'bmad-brainstorming');
    assert.ok(ids(audit(input)).includes('cis/roster-decay'));
  });

  it('fires when testarch rows drop below the floor', () => {
    const input = base();
    input.rows = input.rows.filter((r) => !r[NAME_IDX].startsWith('bmad-testarch-'));
    assert.ok(ids(audit(input)).includes('testarch/too-few'));
  });

  it('fires when a testarch skill is not test-your-code', () => {
    const input = base();
    rowFor(input.rows, 'bmad-testarch-ci')[7] = 'review-something';
    assert.ok(ids(audit(input)).includes('testarch/intent'));
  });
});

describe('resolveRoster — the decay guard', () => {
  it('fires roster-decay when a row vanishes without being declared retired', () => {
    const input = base();
    input.rows = input.rows.filter((r) => r[NAME_IDX] !== 'bmad-agent-architect');
    assert.ok(ids(audit(input)).includes('persona-agent/roster-decay'));
  });

  it('fires manifest-gap when a "retired" skill is still tracked on disk', () => {
    const input = base();
    // `bmad-init` is declared retired, but its files are present: that is a missing row,
    // not a retirement. This is the `bmad-distillator` regression from Round 2.
    input.trackedSkillDirs = [...input.trackedSkillDirs, '_bmad/core/skills/bmad-init'];
    assert.ok(ids(audit(input)).includes('meta-platform/manifest-gap'));
  });

  it('matches a retired skill directory at the tree root (exact basename, not suffix)', () => {
    // Guards `resolveRoster`'s exported contract, which accepts arbitrary injected dirs.
    // Round 2 correction: this input is NOT reachable from `trackedSkillDirsAt`, whose
    // prefix filter guarantees every path it emits contains a slash. The earlier comment
    // claimed it was a producer-reachable bug fix; it is a contract test.
    const { findings } = resolveRoster({
      names: ['bmad-init'],
      rows: [],
      nameIdx: NAME_IDX,
      trackedSkillDirs: ['bmad-init'],
      expectedAbsent: ['bmad-init'],
      label: 'sample',
    });
    assert.ok(ids(findings).includes('sample/manifest-gap'));
  });

  it('does not treat a longer name ending in the roster name as a match', () => {
    const { findings } = resolveRoster({
      names: ['bmad-init'],
      rows: [],
      nameIdx: NAME_IDX,
      trackedSkillDirs: ['_bmad/core/skills/legacy-bmad-init'],
      expectedAbsent: ['bmad-init'],
      label: 'sample',
    });
    assert.ok(!ids(findings).includes('sample/manifest-gap'));
  });

  it('fires stale-retirement when a retired skill reappears in the manifest', () => {
    const input = base();
    input.rows.push(mkRow('bmad-init', 'pipeline', 'meta-platform'));
    assert.ok(ids(audit(input)).includes('meta-platform/stale-retirement'));
  });

  it('fires roster-empty when an entire roster is gone', () => {
    const input = base();
    const utils = Object.keys(STANDALONE_UTILITIES);
    input.rows = input.rows.filter((r) => !utils.includes(r[NAME_IDX]));
    assert.ok(ids(audit(input)).includes('standalone-utility/roster-empty'));
  });

  it('does NOT degrade to 1-of-N: one survivor does not excuse the rest', () => {
    const input = base();
    input.rows = input.rows.filter(
      (r) => !PERSONA_AGENTS.includes(r[NAME_IDX]) || r[NAME_IDX] === 'bmad-agent-pm'
    );
    assert.ok(ids(audit(input)).includes('persona-agent/roster-decay'));
  });

  it('accepts a genuine retirement: declared, and absent from disk', () => {
    const { findings } = resolveRoster({
      names: ['bmad-alive', 'bmad-gone'],
      rows: [mkRow('bmad-alive', 'standalone', 'plan-your-work')],
      nameIdx: NAME_IDX,
      trackedSkillDirs: ['_bmad/core/skills/bmad-alive'],
      expectedAbsent: ['bmad-gone'],
      label: 'sample',
    });
    assert.deepEqual(findings, []);
  });
});

// The git half. Round 1 emptied `trackedSkillDirsAt` and every test stayed green — these
// exist so that mutation fails.
describe('trackedSkillDirsAt — the live enumeration', () => {
  function repoWith(relPaths) {
    const dir = tempDir();
    for (const rel of relPaths) {
      fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), '# skill\n');
    }
    initGitFixture(dir);
    // `core.excludesFile` from the developer's global config is NOT neutralised by
    // initGitFixture (it persists only user/gpgsign/hooksPath repo-locally). A global
    // ignore of `_bmad/` silently staged nothing and left the suite green. Round 1 finding.
    execFileSync('git', ['-c', 'core.excludesFile=', 'add', '-A'], { cwd: dir });
    return dir;
  }

  it('returns the directory of every tracked SKILL.md in the product tree', () => {
    const dir = repoWith([
      '_bmad/core/skills/bmad-help/SKILL.md',
      '_bmad/bme/_vortex/agents/bmad-agent-x/SKILL.md',
    ]);
    assert.deepEqual(trackedSkillDirsAt(dir).sort(), [
      '_bmad/bme/_vortex/agents/bmad-agent-x',
      '_bmad/core/skills/bmad-help',
    ]);
  });

  it('excludes test fixtures and other non-product trees', () => {
    // A fixture is exactly what someone adds when testing a retirement; counting it would
    // permanently block that retirement. Round 1 finding.
    const dir = repoWith([
      '_bmad/core/skills/bmad-help/SKILL.md',
      'tests/fixtures/portability-project/_bmad/core/skills/bmad-distillator/SKILL.md',
      '_bmad-output/exp3-smoke-test/skills/bmad-sample/SKILL.md',
    ]);
    assert.deepEqual(trackedSkillDirsAt(dir), ['_bmad/core/skills/bmad-help']);
  });

  it('ignores files that are not named SKILL.md', () => {
    const dir = repoWith(['_bmad/core/skills/bmad-help/SKILL.md', '_bmad/core/skills/notes.md']);
    assert.deepEqual(trackedSkillDirsAt(dir), ['_bmad/core/skills/bmad-help']);
  });

  it('throws GitUnavailableError when the directory is not a git repo', () => {
    const dir = tempDir();
    assert.throws(() => trackedSkillDirsAt(dir), GitUnavailableError);
  });
});

describe('CLI — end to end against a git fixture', () => {
  const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'audit', 'skill-manifest-integrity.js');

  function fixtureWith(rows) {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, '_bmad', '_config'), { recursive: true });
    for (const r of rows) {
      const skillDir = path.join(dir, '_bmad', 'core', 'skills', r[NAME_IDX]);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `# ${r[NAME_IDX]}\n`);
    }
    // The manifest reader is CSV-quoting-sensitive, so build the file the way the real one
    // is written rather than hand-rolling a shape the parser may not accept.
    writeManifest(path.join(dir, '_bmad', '_config', 'skill-manifest.csv'), HEADER, rows);
    initGitFixture(dir);
    execFileSync('git', ['-c', 'core.excludesFile=', 'add', '-A'], { cwd: dir });
    return dir;
  }

  const run = (args) => {
    try {
      return { code: 0, stdout: execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8' }) };
    } catch (err) {
      return { code: err.status, stdout: (err.stdout || '') + (err.stderr || '') };
    }
  };

  it('exits 0 and reports PASS on a conformant manifest', () => {
    const { code, stdout } = run(['--project-root', fixtureWith(validRows())]);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /✓ PASS/);
  });

  it('exits 2 and names the offending row on a corrupt manifest', () => {
    const rows = validRows();
    rowFor(rows, 'bmad-help')[6] = 'semi-standalone';
    const { code, stdout } = run(['--project-root', fixtureWith(rows)]);
    assert.equal(code, 2, stdout);
    assert.match(stdout, /✗ FAIL/);
    assert.match(stdout, /row\/invalid-tier: bmad-help/);
  });

  it('exits 1 with usage when --project-root has no value', () => {
    const { code, stdout } = run(['--project-root']);
    assert.equal(code, 1, stdout);
    assert.match(stdout, /--project-root requires a path/);
  });

  it('exits 1 rather than silently auditing cwd when --project-root is empty', () => {
    const { code, stdout } = run(['--project-root', '']);
    assert.equal(code, 1, stdout);
    assert.match(stdout, /--project-root requires a path/);
  });

  it('exits 1 with a readable message when the manifest is missing', () => {
    const { code, stdout } = run(['--project-root', tempDir()]);
    assert.equal(code, 1, stdout);
    assert.match(stdout, /could not read/);
    assert.doesNotMatch(stdout, /at Object\./, 'should not surface a raw stack trace');
  });

  it('exits 1 on an unknown argument', () => {
    const { code, stdout } = run(['--reticulate-splines']);
    assert.equal(code, 1, stdout);
    assert.match(stdout, /unknown argument/);
  });

  it('exits 0 and prints usage for --help', () => {
    const { code, stdout } = run(['--help']);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /Usage: skill-manifest-integrity\.js/);
  });
});

// Round 2 of sp-7-1 rejected importing the classification vocabulary from `classify-skills.js`
// — a checker must not take its definition of "valid" from the module it polices, because
// widening the writer would silently widen the gate. Proven at the time: adding a bogus tier to
// the writer made the audit accept it with zero test failures. Each copy therefore declares its
// own, and this block is what stops them drifting apart unnoticed.
//
// THREE copies, one writer and two checkers. Derived from the table below rather than written
// out pairwise, so adding a fourth copy is one line and cannot half-land:
//
//   A  scripts/portability/classify-skills.js          WRITER   — assigns tier/intent
//   B  scripts/audit/skill-manifest-integrity.js       CHECKER  — lints the manifest's rows
//   C  scripts/portability/validate-classification.js  CHECKER  — validates completeness + deps
//
// sp-7-2 added C. Before that only A<->B was pinned, so a checker RE-EXPORTING the other
// checker's array was invisible. Every unordered pair is now checked for identity, which closes
// exactly that: a SHARED INSTANCE. It does not close a COPYING import — a spread yields two
// distinct arrays holding one value, and that case passes every assertion here. See section 3.
//
// It lives in the audit's test file for a practical reason, not a principled one: this file
// already owns the manifest-lint fixtures the block sits beside. Each copy is party to exactly
// two of the three pairs, so no copy is a privileged home. Round 1 caught an earlier version
// of this sentence claiming B was party to every pair, which is arithmetically impossible.
describe('classification vocabulary — pinned across all three copies', () => {
  const COPIES = [
    { key: 'A', role: 'writer', name: 'classify-skills.js', mod: require('../../scripts/portability/classify-skills') },
    { key: 'B', role: 'checker', name: 'skill-manifest-integrity.js', mod: require('../../scripts/audit/skill-manifest-integrity.js') },
    { key: 'C', role: 'checker', name: 'validate-classification.js', mod: require('../../scripts/portability/validate-classification') },
  ];
  const VOCAB = ['VALID_TIERS', 'VALID_INTENTS'];
  const writer = COPIES.find((c) => c.role === 'writer');
  const checkers = COPIES.filter((c) => c.role === 'checker');

  // The table drives every loop below, so a typo in `role` silently emits FEWER tests rather
  // than failing — Round 1 measured `role: 'Checker'` dropping 6 of 9 with a green suite.
  // `node --test` cannot tell a full run from a truncated one, so the shape is asserted here.
  it('the copy table is well-formed', () => {
    assert.equal(COPIES.filter((c) => c.role === 'writer').length, 1, 'expected exactly one writer');
    assert.ok(checkers.length >= 2, `expected at least two checkers, got ${checkers.length}`);
    assert.deepEqual(
      COPIES.filter((c) => !['writer', 'checker'].includes(c.role)),
      [],
      'a copy carries an unrecognised role and is silently excluded from the loops below'
    );
    // Same hazard, other table: with `VOCAB = []` the four value-agreement tests are never
    // emitted and the identity tests pass on empty inner loops — measured green before this
    // guard existed.
    assert.deepEqual(
      VOCAB,
      ['VALID_TIERS', 'VALID_INTENTS'],
      'VOCAB drives every loop below; an empty or renamed entry deletes assertions silently'
    );
  });

  // 1. Value agreement: every checker matches the writer.
  for (const checker of checkers) {
    for (const key of VOCAB) {
      it(`${checker.name} ${key} matches the writer exactly`, () => {
        assert.deepEqual(
          checker.mod[key],
          writer.mod[key],
          `${checker.name} and ${writer.name} disagree on ${key} — one was widened alone`
        );
      });
    }
  }

  // 2. Identity, EVERY unordered pair — including checker<->checker, which is the pair the
  //    pre-sp-7-2 version could not see. A shared instance means the value was imported,
  //    however the import was spelled, and makes every deepEqual above compare a value with
  //    itself.
  for (let i = 0; i < COPIES.length; i += 1) {
    for (let j = i + 1; j < COPIES.length; j += 1) {
      const [x, y] = [COPIES[i], COPIES[j]];
      it(`${x.key} and ${y.key} do not share a vocabulary instance`, () => {
        for (const key of VOCAB) {
          assert.notStrictEqual(
            x.mod[key],
            y.mod[key],
            `${x.name} and ${y.name} share one ${key} instance — it was imported, not declared`
          );
        }
      });
    }
  }

  // 3. WHAT THIS PIN DOES NOT ESTABLISH — stated because two attempts to establish it failed.
  //
  //    sp-7-2 Round 1 tried a source check naming the two counterpart filenames. It was a
  //    denylist, not a property: routing both checkers through a THIRD module passed every
  //    test while a widened writer left both accepting a bogus tier.
  //
  //    Round 2 tried "each copy must DECLARE its vocabulary as an array literal", parsed from
  //    source. Four independent defeats, each executed and each 78/78 green with a bogus tier
  //    live in all three copies: a `push(...require(...))` on the line AFTER a pristine literal
  //    (`const` binds the reference, not the contents); a decoy comment carrying the canonical
  //    literal so the leftmost match never reached the real `require`; `//` inside a string
  //    element eating the rest of the line; and the lazy capture stopping at a `];` inside a
  //    string. It also FALSELY accused legitimate values — an intent named `requires-approval`
  //    reddened the gate with a message about an import that did not exist.
  //
  //    Detecting a COPYING import is not achievable here. A spread at load time produces a
  //    genuinely independent array, indistinguishable at runtime from a literal, and any
  //    regex over JavaScript source is defeatable. Per `code-review-convergence`'s
  //    prefer-deletion clause the check was removed rather than attempted a third time.
  //
  //    SO: the two families above catch independent drift (value agreement) and a shared
  //    instance (identity). They do NOT catch all three copies being widened together through
  //    a common module. The copies stay literal by CONVENTION, enforced by review and by the
  //    role comments at each site — not by this suite. That gap is filed in `deferred-work.md`
  //    under "nothing detects all three copies being widened TOGETHER". Any future move to
  //    consolidate the vocabulary is precisely what ships green while widening every gate.
});

describe('product-tree scope and roster escape hatches', () => {
  it('counts tracked Convoke skills under .claude/skills/', () => {
    // Round 2: an earlier `_bmad/`-only filter excluded `bmad-audit-skill-dirs` and
    // `bmad-register-skill`, which are tracked and shipped.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-manifest-audit-'));
    created.push(dir);
    for (const rel of [
      '_bmad/core/skills/bmad-help/SKILL.md',
      '.claude/skills/bmad-register-skill/SKILL.md',
      'tests/fixtures/x/_bmad/core/skills/bmad-distillator/SKILL.md',
    ]) {
      fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), '# skill\n');
    }
    initGitFixture(dir);
    execFileSync('git', ['-c', 'core.excludesFile=', 'add', '-A'], { cwd: dir });
    assert.deepEqual(trackedSkillDirsAt(dir).sort(), [
      '.claude/skills/bmad-register-skill',
      '_bmad/core/skills/bmad-help',
    ]);
  });

  it('lets a CIS skill be declared retired, like every other roster', () => {
    // Round 2: CIS was the one roster with no escape hatch, so a legitimate upstream
    // retirement would have reddened CI with no way to record it.
    const input = base();
    input.rows = input.rows.filter((r) => r[NAME_IDX] !== 'bmad-brainstorming');
    assert.ok(ids(audit(input)).includes('cis/roster-decay'));
    assert.ok(Array.isArray(RETIRED.cis), 'RETIRED.cis must exist as a declarable list');

    // Declaring it silences the decay finding, exactly as for the other rosters — but only
    // for a GENUINE retirement, where the files are gone too. Leaving the directory tracked
    // correctly reports `cis/manifest-gap` instead, which is the `bmad-distillator` guard.
    const declared = resolveRoster({
      names: Object.keys(CIS_POLICY),
      rows: input.rows,
      nameIdx: NAME_IDX,
      trackedSkillDirs: input.trackedSkillDirs.filter(
        (d) => path.basename(d) !== 'bmad-brainstorming'
      ),
      expectedAbsent: ['bmad-brainstorming'],
      label: 'cis',
    });
    assert.deepEqual(ids(declared.findings), []);
  });
});

describe('CLI — argument handling hardened in Round 2', () => {
  const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'audit', 'skill-manifest-integrity.js');
  const run = (args, opts = {}) => {
    try {
      return { code: 0, stdout: execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8', ...opts }) };
    } catch (err) {
      return { code: err.status, stdout: (err.stdout || '') + (err.stderr || '') };
    }
  };

  it('rejects a bare positional path instead of auditing the wrong tree', () => {
    // Round 2: this printed `✓ PASS — 106 rows` for the enclosing repo and exited 0.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-manifest-audit-'));
    created.push(dir);
    const { code, stdout } = run([dir]);
    assert.equal(code, 1, stdout);
    assert.match(stdout, /unknown argument/);
    assert.doesNotMatch(stdout, /PASS/);
  });

  it('rejects a repeated --project-root instead of silently using the first', () => {
    const { code, stdout } = run(['--project-root', '.', '--project-root', os.tmpdir()]);
    assert.equal(code, 1, stdout);
    assert.match(stdout, /more than once/);
  });

  it('exits 1 without printing PASS when the tree is not a git repo', () => {
    // The `main()` half of the GitUnavailableError path — the unit test above proves only
    // that `trackedSkillDirsAt` throws. Round 2 finding.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-manifest-audit-'));
    created.push(dir);
    fs.mkdirSync(path.join(dir, '_bmad', '_config'), { recursive: true });
    writeManifest(path.join(dir, '_bmad', '_config', 'skill-manifest.csv'), HEADER, validRows());
    const { code, stdout } = run(['--project-root', dir]);
    assert.equal(code, 1, stdout);
    assert.match(stdout, /cannot run without git/);
    assert.doesNotMatch(stdout, /PASS/);
  });
});

// ---------------------------------------------------------------------------
// sp-7-1: coverage folded in from the deleted tests/lib/portability-schema.test.js.
//
// That file was a LINT wearing a test's clothes — five assertions over two tracked
// artifacts, no code under test — and it read the live tree via findProjectRoot(),
// violating `test-fixture-isolation`. Three of its assertions were unique; the other two
// (tier and intent vocabulary) already existed here as row/invalid-tier and
// row/invalid-intent and were NOT duplicated.
// ---------------------------------------------------------------------------

describe('audit — header column order (folded from portability-schema Test 1)', () => {
  it('fires when the header carries the right columns in the wrong order', () => {
    const input = base();
    const h = [...HEADER];
    const i = h.indexOf('tier');
    const j = h.indexOf('intent');
    [h[i], h[j]] = [h[j], h[i]];
    input.header = h;
    assert.ok(ids(audit(input)).includes('header/column-order'));
  });

  it('does not fire on the canonical order', () => {
    assert.ok(!ids(audit(base())).includes('header/column-order'));
  });

  it('still reports a missing column, and still stops before trusting the rows', () => {
    const input = base();
    input.header = HEADER.filter((c) => c !== 'intent');
    assert.deepEqual(ids(audit(input)), ['header/missing-column']);
  });

  it('a header finding does not suppress the manifest checks below it', () => {
    // The early return guards on missing COLUMNS, not on findings.length, so a finding pushed
    // before it cannot short-circuit everything after it.
    const input = base();
    const h = [...HEADER];
    const i = h.indexOf('canonicalId');
    const j = h.indexOf('description');
    [h[i], h[j]] = [h[j], h[i]];
    input.header = h;
    rowFor(input.rows, 'bmad-help')[6] = 'semi-standalone';
    const out = ids(audit(input));
    assert.ok(out.includes('header/column-order'));
    assert.ok(out.includes('row/invalid-tier'), `manifest checks were suppressed: ${out.join(', ')}`);
  });
});

describe('audit — exact row arity (folded from portability-schema Test 2)', () => {
  it('fires on a row with MORE fields than the header', () => {
    // An unescaped comma inside a description splits the row. Before sp-7-1 the check was
    // `row.length < header.length`, so this audited completely clean.
    const input = base();
    const long = [...mkRow('bmad-extra', 'standalone', 'plan-your-work'), 'spilled'];
    input.rows = [long, ...input.rows];
    assert.ok(ids(audit(input)).includes('row/malformed'));
  });

  it('still fires on a row with FEWER fields, and keeps auditing the rest', () => {
    const input = base();
    input.rows = [['orphan'], ...input.rows];
    let findings;
    assert.doesNotThrow(() => {
      findings = audit(input);
    });
    assert.deepEqual(ids(findings), ['row/malformed']);
  });
});


// ---------------------------------------------------------------------------
// sp-7-1 Round 1 remediation. Each test below pins a defect the review PROVED by
// execution, so reverting any fix turns this suite red.
// ---------------------------------------------------------------------------

describe('audit — Round 1 fixes', () => {
  it('does NOT report roster decay for a row that is merely malformed', () => {
    // Round 1: a row one field too long left `wellFormed`, and the roster then advised the
    // operator to declare `bmad-help` an upstream retirement — which corrupts roster policy.
    const input = base();
    const i = input.rows.findIndex((r) => r[NAME_IDX] === 'bmad-help');
    input.rows[i] = [...input.rows[i], 'spilled'];
    const out = ids(audit(input));
    assert.ok(out.includes('row/malformed'), 'the malformed row must still be reported');
    assert.ok(
      !out.includes('meta-platform/roster-decay'),
      `a present-but-malformed row is not a retirement; got: ${out.join(', ')}`
    );
  });

  it('keeps the indexed columns derived from the ordered contract', () => {
    for (const col of ['name', 'tier', 'intent', 'dependencies']) {
      assert.ok(
        auditModule.EXPECTED_HEADER_COLUMNS.includes(col),
        `${col} is indexed positionally but absent from the ordered contract`
      );
    }
  });
});

// Round 2 found that the Round 1 `namedRows` fix guarded three of the FOUR roster loops and
// missed the CIS one, crashing with a TypeError on any malformed CIS row. This covers every
// roster by name so the class cannot recur when a fifth is added.
describe('audit — a malformed row never crashes any roster loop (Round 2)', () => {
  const ROSTER_SAMPLES = [
    ['meta-platform', 'bmad-help'],
    ['standalone-utility', 'bmad-shard-doc'],
    ['persona-agent', 'bmad-agent-architect'],
    ['cis', 'bmad-brainstorming'],
  ];

  for (const [roster, sample] of ROSTER_SAMPLES) {
    it(`survives a too-long row in the ${roster} roster`, () => {
      const input = base();
      const i = input.rows.findIndex((r) => r[NAME_IDX] === sample);
      assert.notEqual(i, -1, `${sample} missing from the fixture`);
      input.rows[i] = [...input.rows[i], 'spilled'];
      let out;
      assert.doesNotThrow(() => {
        out = ids(audit(input));
      }, `${roster} loop threw on a malformed row`);
      assert.ok(out.includes('row/malformed'));
    });

    it(`survives a too-short row in the ${roster} roster`, () => {
      const input = base();
      const i = input.rows.findIndex((r) => r[NAME_IDX] === sample);
      assert.notEqual(i, -1, `${sample} missing from the fixture`);
      input.rows[i] = input.rows[i].slice(0, NAME_IDX + 1);
      let out;
      assert.doesNotThrow(() => {
        out = ids(audit(input));
      }, `${roster} loop threw on a truncated row`);
      assert.ok(out.includes('row/malformed'));
    });
  }

  // Round 3: `wellFormedRows` was passed at all four call sites but exercised at only one, so
  // deleting it from any of the other three left the suite green. Parameterised over every
  // roster that actually declares retirements.
  for (const [roster, retired] of [
    ['meta-platform', RETIRED.metaPlatform],
    ['persona-agent', RETIRED.personaAgents],
  ]) {
    for (const name of retired) {
      it(`does not advise un-retiring a merely-malformed ${roster} row (${name})`, () => {
        const input = base();
        input.rows.push([...mkRow(name, 'standalone', 'plan-your-work'), 'spilled']);
        const out = ids(audit(input));
        assert.ok(out.includes('row/malformed'));
        assert.ok(
          !out.includes(`${roster}/stale-retirement`),
          `a malformed row is not evidence of reappearance; got: ${out.join(', ')}`
        );
      });
    }
  }
});

