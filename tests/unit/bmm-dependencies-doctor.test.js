'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const PKG_VERSION = require('../../package.json').version;
// BUG-12 consolidated five hand-rolled regex escapes into this helper; these two
// sites were a sixth, added after that landed. Escaping only `.` and `+` is safe
// for any valid semver (the set is `[0-9A-Za-z-.+]`), so this is a class fix, not
// a live defect — CodeQL alerts 24/25, js/incomplete-sanitization.
const { escapeRegExp } = require('../../scripts/lib/sanitize');

const {
  checkBmmDependencies,
  BMM_DRIFT_SUMMARY_THRESHOLD,
} = require('../../scripts/convoke-doctor');

const {
  CSV_HEADER,
} = require('../../scripts/audit/audit-bmm-dependencies');

const FIXTURE_ROOT = path.join(__dirname, '..', 'fixtures', 'bmm-dependencies');

// --- helpers ---

/**
 * Build a tmp project root with `.claude/skills/` populated from named fixtures
 * (copied from the Story 2.1 fixture tree).
 *
 * @param {string[]} fixtureNames
 * @returns {Promise<string>} tmp project root
 */
async function buildTmpProject(fixtureNames = []) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-'));
  const skillsRoot = path.join(tmp, '.claude', 'skills');
  await fs.ensureDir(skillsRoot);
  for (const name of fixtureNames) {
    await fs.copy(path.join(FIXTURE_ROOT, name), path.join(skillsRoot, name));
  }
  return tmp;
}

/**
 * Seed a `source_module: unknown` custom skill whose frontmatter declares a BMM dependency, which
 * is what Category 2 (`[unregistered]`) fires on. Mirrors the inline setup the FR17 test above
 * uses; factored out because T254's advice tests need it for several hostile names.
 */
async function seedCustomSkill(tmpRoot, skillName, agent) {
  const skillDir = path.join(tmpRoot, '.claude', 'skills', skillName);
  await fs.ensureDir(skillDir);
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    `---\nname: ${JSON.stringify(skillName)}\ndependencies:\n  - ${agent}\n---\nContent.\n`,
    'utf8',
  );
}

/**
 * Seed a `_bmad/_config/bmm-dependencies.csv` with the given row objects
 * (header prepended automatically). `registered_by` is taken verbatim from
 * each row object.
 */
async function seedCsv(tmpRoot, rows) {
  const csvPath = path.join(tmpRoot, '_bmad', '_config', 'bmm-dependencies.csv');
  await fs.ensureDir(path.dirname(csvPath));
  const lines = [CSV_HEADER, ...rows.map(r => [
    r.skill_name, r.bmm_agent, r.dependency_type, r.source_module,
    r.registered_by, r.registered_date,
  ].join(','))];
  await fs.writeFile(csvPath, lines.join('\n') + '\n', 'utf8');
  return csvPath;
}

// --- AC5: CSV absent ---

describe('checkBmmDependencies — AC5 CSV-absent path', () => {
  let tmpRoot;
  afterEach(async () => { if (tmpRoot) await fs.remove(tmpRoot); tmpRoot = null; });

  it('returns single informational finding when bmm-dependencies.csv is absent', async () => {
    tmpRoot = await buildTmpProject([]);
    const results = checkBmmDependencies(tmpRoot);
    assert.equal(results.length, 1);
    assert.equal(results[0].passed, false);
    assert.equal(results[0].softWarning, true);
    assert.match(results[0].warning, /bmm-dependencies\.csv not found/);
    // I137: previously asserted `node scripts/audit/audit-bmm-dependencies.js` — a path that does
    // NOT exist in a user's project, so this test was PINNING unrunnable advice. The script is now
    // exposed as the `convoke-audit-bmm-deps` bin and invoked via npx, like every other remediation.
    assert.match(results[0].fix, new RegExp(`npx -p convoke-agents@${escapeRegExp(PKG_VERSION)} convoke-audit-bmm-deps`));
    // AC3 fail-soft: no `error` field used for governance.
    assert.equal(results[0].error, undefined);
  });

  // BUG-19(a) / dist-2-5 FR17: the label must agree with its own finding. This
  // branch fires ONLY when the registry is absent, so a name asserting the
  // registry is *present* states the opposite of everything else on the finding.
  // Attribution, precisely: the Story 4.5 N=1 report (2026-08-15) records the
  // validator reacting to the WARNINGS appearing on a healthy install; the
  // label-contradicts-message observation is the report author's, and the
  // recruitment protocol had pre-classified it as CONCERN before the session ran.
  //
  // Name and warning are asserted as ONE rendered string, not as halves in two
  // assertions. Pinned separately they can drift back into contradiction while
  // both stay green: that is the failure this test exists to prevent, so a
  // half-assertion here would reproduce the very defect under repair. The
  // NFR8 contract fields (`softWarning`, `passed`, `fix`) are already pinned by
  // the AC5 test above and are deliberately not restated.
  // Names the fields, not the rendering: `printResults` is not exercised here, so
  // the ⚠ line an operator actually sees is covered by neither this test nor any other.
  it('pairs a CSV-absent label with a message it does not contradict', async () => {
    tmpRoot = await buildTmpProject([]);
    const results = checkBmmDependencies(tmpRoot);
    assert.equal(
      `${results[0].name} — ${results[0].warning}`,
      'BMM dependencies: registry missing — bmm-dependencies.csv not found'
      + ' — governance registry has not been generated yet'
    );
  });
});

// --- AC3 Category 1: stale-autoscan ---

describe('checkBmmDependencies — AC3 stale-autoscan (skill-gone)', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [stale:skill-gone] finding when auto-scan row references a missing skill', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    await seedCsv(tmpRoot, [{
      skill_name: 'removed-skill',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-01-01',
    }]);
    const results = checkBmmDependencies(tmpRoot);
    const stale = results.find(r => r.name.includes('stale:skill-gone'));
    assert.ok(stale, `expected stale:skill-gone finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(stale.softWarning, true);
    assert.match(stale.name, /removed-skill/);
  });
});

describe('checkBmmDependencies — AC3 stale-autoscan (dep-removed)', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [stale:dep-removed] finding when auto-scan row references present skill with absent dep', async () => {
    tmpRoot = await buildTmpProject(['skill-with-removed-dep']);
    await seedCsv(tmpRoot, [{
      skill_name: 'skill-with-removed-dep',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-01-01',
    }]);
    const results = checkBmmDependencies(tmpRoot);
    const stale = results.find(r => r.name.includes('stale:dep-removed'));
    assert.ok(stale, `expected stale:dep-removed finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(stale.softWarning, true);
  });
});

// --- AC3 Category 2: unregistered-custom-skill (FR17) ---

describe('checkBmmDependencies — AC3/AC4 unregistered-custom-skill', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits FR17-formatted registration instructions for source_module=unknown skills not in CSV', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-fr17-'));
    // Create a fixture skill with `unknown` prefix that scan will detect
    // via frontmatter dependencies.
    const skillDir = path.join(tmpRoot, '.claude', 'skills', 'my-custom-tool');
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: my-custom-tool\ndependencies:\n  - bmad-agent-pm\n---\nContent.\n',
      'utf8',
    );
    // Seed CSV with header only (no rows), so the scan finds drift.
    await seedCsv(tmpRoot, []);
    const results = checkBmmDependencies(tmpRoot);
    const unreg = results.find(r => r.name.includes('[unregistered]'));
    assert.ok(unreg, `expected [unregistered] finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(unreg.softWarning, true);
    assert.match(unreg.name, /my-custom-tool/);
    assert.match(unreg.warning, /custom skill not in registry/);
    // This assertion has now been corrected three times, and the lineage is the point.
    // I137 replaced `node scripts/audit/audit-bmm-dependencies.js` — a path absent from a user's
    // project — because the test was PINNING UNRUNNABLE advice. It then pinned advice that runs
    // and dead-ends: `convoke-audit-bmm-deps` writes an `auto-scan` row for this very skill, and
    // on any build without T112 (including the published v4.0.3) the operator's own registration
    // is refused with `Duplicate triple … registered by auto-scan`. T254. So runnable was never
    // the bar — the bar is that following it resolves the finding.
    // ONE assertion over the whole command line, not a `convoke-register-skill` match and a
    // separate flags match. T254 R2 showed those two are independent: a fix naming the right
    // command on one line and showing the right flags on a DIFFERENT binary satisfied both.
    assert.equal(
      unreg.fix,
      'Register it with:\n'
      + `  npx -p convoke-agents@${PKG_VERSION} convoke-register-skill`
      + " --skill 'my-custom-tool' --agent 'bmad-agent-pm' --type 'frontmatter'",
      'the flags must be bound to the command line they belong to, not merely co-present'
    );
    // The equality above already pins the DETECTED type: a `--type` differing from the scanned one
    // creates a second row with no duplicate, no claim and no warning, which nothing reconciles.
    // On the quoting of `--agent` and `--type`: those two are closed by the scanner
    // (`AGENT_NAME_EXACT_RE` is `/^bmad-agent-[a-z0-9-]+$/` and the type is a two-value enum), so
    // quoting them is defence in depth, NOT a reachable threat. R2 corrected the claim that it was.
    assert.doesNotMatch(unreg.fix, /convoke-audit-bmm-deps/,
      'the scanner must not be offered for THIS finding — it creates the row that blocks the fix');
    assert.doesNotMatch(unreg.fix, /your-email@example\.com|<YYYY-MM-DD>/,
      'the hand-edit template silenced this warning with placeholder data, unvalidated');
  });

  it('quotes the interpolated skill name, which an operator pastes into a shell', async () => {
    // The advice is a command line. `skill_name` is an arbitrary `.claude/skills/` directory name,
    // and this category fires ONLY for `source_module === 'unknown'` — third-party and cloned
    // skills. Unquoted, `evil$(touch PWNED)skill` emitted a command that ran the substitution when
    // pasted, measured in bash and zsh. The pre-T254 advice put this name in a CSV row, so the
    // shell surface was introduced, not inherited.
    const hostile = 'evil$(touch PWNED)skill';
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-shq-'));
    await seedCustomSkill(tmpRoot, hostile, 'bmad-agent-pm');
    await seedCsv(tmpRoot, []);
    const unreg = checkBmmDependencies(tmpRoot).find(r => r.name.includes(hostile));
    assert.ok(unreg, 'expected a finding for the hostile name');
    assert.match(unreg.fix, /--skill 'evil\$\(touch PWNED\)skill'/,
      'the name must be single-quoted so the substitution is inert when pasted');
    assert.doesNotMatch(unreg.fix, /--skill evil\$\(/, 'an unquoted interpolation is the defect');
  });

  it("escapes a single quote in the name rather than breaking the command", async () => {
    const tricky = "quote'skill";
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-quo-'));
    await seedCustomSkill(tmpRoot, tricky, 'bmad-agent-pm');
    await seedCsv(tmpRoot, []);
    const unreg = checkBmmDependencies(tmpRoot).find(r => r.name.includes(tricky));
    assert.ok(unreg);
    // POSIX: close the quote, emit an escaped quote, reopen.
    assert.match(unreg.fix, /--skill 'quote'\\''skill'/);
  });

  it('refuses to emit a command for a name the registry rewrites on write', async () => {
    // `_sanitizeFormula` prefixes a field beginning `= + - @`, tab or CR with `'`. Measured:
    // `--skill -dash-skill` prints `✓ Registered`, writes `'-dash-skill`, leaves this finding
    // standing and adds a `[missing-target]` one — and each re-run appends another row.
    //
    // An earlier draft of this comment said `verifyRegistration` applies the same rule to its
    // candidate "so the writer cannot see the divergence". R2 ran it: the writer DOES see it and
    // prints `⚠ Registration written but … not found in CSV re-read`, because `_tripleKey`
    // looks up the UNSANITIZED candidate and misses before `_sanitizeForCompare` is reached. The
    // verdict is unchanged — exit 0, the finding survives — but the mechanism was wrong, and a
    // wrong mechanism misdirects whoever fixes it.
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-dash-'));
    await seedCustomSkill(tmpRoot, '-dash-skill', 'bmad-agent-pm');
    await seedCsv(tmpRoot, []);
    const unreg = checkBmmDependencies(tmpRoot).find(r => r.name.includes('-dash-skill'));
    assert.ok(unreg);
    // NOT `doesNotMatch(/convoke-register-skill/)`: the rename text names the command in order to
    // say the name cannot be passed to it. What must be absent is a RUNNABLE invocation.
    assert.doesNotMatch(unreg.fix, /convoke-register-skill --skill/,
      'advising the command here reports success and resolves nothing');
    assert.match(unreg.fix, /mv -- '\.claude\/skills\/-dash-skill'/,
      'the rename needs `--`: `mv \'-dash-skill\' x` exits 64 with `illegal option -- d`');
  });

  // T254 R2 HIGH: the gate that chooses between these two branches used to be a RE-DERIVATION of
  // the registry's rules, assembled from the sanitizer and the validator and never from the
  // PARSER — which trims every flag value. This is the property that makes the whole class
  // un-reintroducible, so it is asserted against `parseArgs` itself rather than against a name
  // list: IF the advice is a command, the name the parser extracts from it must be the name the
  // finding is about. Under the old gate `my-skill ` failed this, and the failure was not
  // cosmetic — see the sibling test below.
  it('never advises a command whose own parser would read a different skill name', async () => {
    const { _internal: { parseArgs } } = require('../../scripts/convoke-register-skill');
    // Nine, deliberately: at `BMM_DRIFT_SUMMARY_THRESHOLD` (10) the per-skill branch collapses
    // into the summary and there are no per-skill `fix:` strings left to assert on. The first
    // draft used seventeen names, found zero `[unregistered]` findings, and would have passed
    // vacuously had it not asserted the fixture's own size.
    const names = [
      'plain-ok-skill', 'evil$(touch PWNED)skill', "quote'skill",
      'trailing ', ' leading', '-dash-skill', '=eq', 'a..b', 'embed\nnewline',
    ];
    assert.ok(names.length < BMM_DRIFT_SUMMARY_THRESHOLD,
      'fixture: more names than the threshold collapses the per-skill branch away');
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-parser-'));
    for (const n of names) await seedCustomSkill(tmpRoot, n, 'bmad-agent-pm');
    await seedCsv(tmpRoot, []);
    const findings = checkBmmDependencies(tmpRoot).filter(r => r.name.includes('[unregistered]'));
    assert.equal(findings.length, names.length,
      `fixture: expected one finding per name, got ${findings.length}`);
    let commands = 0;
    for (const f of findings) {
      const m = f.fix.match(/convoke-register-skill --skill (.*?) --agent /);
      if (!m) continue;                       // the rename branch: covered by the tests around this one
      commands += 1;
      // Undo exactly one level of POSIX single-quoting to recover the argv value.
      const argv = m[1].replace(/^'|'$/g, '').replace(/'\\''/g, "'");
      const seen = parseArgs(['--skill', argv, '--agent', 'bmad-agent-pm', '--type', 'frontmatter']).skill;
      const subject = f.name.replace(/^BMM dependencies: \[unregistered] /, '').replace(/ → .*$/, '');
      assert.equal(seen, subject,
        `the advice for ${JSON.stringify(subject)} is a command the parser reads as ${JSON.stringify(seen)}`);
    }
    assert.ok(commands >= 3, `vacuity: only ${commands} of ${names.length} took the command branch`);

    // The property above is silent about WHICH branch a name takes, so deleting half the gate
    // survived it. This pins the branch per class. `a..b` is the only member of the
    // validator-refused class that is reachable at all: `..foo` and `.hidden` never produce a
    // finding, because the scanner skips dot-directories (`_findSkillDirectories`).
    // Keyed on a substring that is unique within this fixture, NOT on the raw name: a
    // control-character name is rendered escaped by `displaySafe`, so looking it up by the raw
    // string would make this test re-implement `displaySafe` and go stale the moment the escaping
    // changes. The lookup is asserted unique so a careless addition to `names` cannot silently
    // retarget it.
    const branchOf = (key) => {
      const hits = findings.filter(x => x.name.includes(key));
      assert.equal(hits.length, 1, `fixture: ${JSON.stringify(key)} matched ${hits.length} findings`);
      return /convoke-register-skill --skill/.test(hits[0].fix) ? 'COMMAND' : 'RENAME';
    };
    for (const k of ['plain-ok-skill', 'evil$(touch PWNED)skill', "quote'skill"]) {
      assert.equal(branchOf(k), 'COMMAND', `${JSON.stringify(k)} is quotable and must be advised`);
    }
    for (const k of ['trailing ', ' leading', '-dash-skill', '=eq', 'a..b', 'embed']) {
      assert.equal(branchOf(k), 'RENAME', `${JSON.stringify(k)} cannot be carried by the CLI`);
    }
  });

  // The measured consequence, kept as its own test because the property above states the rule and
  // this states the damage: a trailing-space clone beside the operator's own skill. Under the old
  // gate the clone's advice exited 0, printed `✓ Registered` and the machine-readable `REGISTERED:`
  // marker, and wrote a governance row asserting `my-skill → bmad-agent-pm` — a dependency the
  // scan never found, attributed to the operator — while BOTH findings survived.
  it('does not hand a trailing-space clone a command that registers the real skill', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-clone-'));
    await seedCustomSkill(tmpRoot, 'my-skill ', 'bmad-agent-pm');   // the clone
    await seedCustomSkill(tmpRoot, 'my-skill', 'bmad-agent-dev');   // the operator's own
    await seedCsv(tmpRoot, []);
    const all = checkBmmDependencies(tmpRoot).filter(r => r.name.includes('[unregistered]'));
    const clone = all.find(r => r.name.includes('my-skill  →'));
    const mine = all.find(r => r.name.includes('my-skill →'));
    assert.ok(clone && mine, `fixture: expected both findings, got ${all.map(r => r.name).join(' | ')}`);
    assert.doesNotMatch(clone.fix, /convoke-register-skill --skill/,
      'the clone must not be advised to run the command at all');
    assert.match(clone.fix, /mv -- '\.claude\/skills\/my-skill '/);
    // And the operator's own skill is still advised normally — the fix must not blanket-refuse.
    assert.match(mine.fix, /convoke-register-skill --skill 'my-skill' --agent 'bmad-agent-dev'/);
  });

  // T254 R2: a control character in the name reached the terminal unescaped, so a directory could
  // print a complete, correctly formatted PASSING finding that no check produced, choose its own
  // colour with an ESC, or overwrite the `⚠` prefix with a CR. Measured against the real CLI.
  it('lets no control character from a skill name reach the rendered finding', async () => {
    // The hostile set spans every class the shared authority covers, because each one defeated the
    // version of this test that preceded it: `\n` and `\r` (C0), ESC (colour), U+0085 NEL and
    // U+009b CSI (C1 — the 8-bit forms, so escaping ESC alone is not enough), U+2028 LINE
    // SEPARATOR (not a control character at all, and it forged a passing line past four separate
    // assertions), and U+202E RIGHT-TO-LEFT OVERRIDE (reorders the rest of the line).
    const hostile = 'legit\n  \u001b[32m✓ BMM dependencies: registry consistent\u001b[0m\r'
      + '\u0085\u009b\u2028  ✓ registry consistent\u202Edrowssap';
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-ctrl-'));
    await seedCustomSkill(tmpRoot, hostile, 'bmad-agent-pm');
    await seedCsv(tmpRoot, []);
    const f = checkBmmDependencies(tmpRoot).find(r => r.name.includes('[unregistered]'));
    assert.ok(f, 'fixture: expected a finding for the control-character name');
    // The SHARED authority, not a local copy. A local C0/C1 predicate here is what let U+2028
    // through: the test agreed with the bug.
    const { hasDangerousCodePoint: hasControl } = require('../../scripts/lib/sanitize');
    // `fix` legitimately contains newlines of its own, so the name's own escaping is asserted on
    // `name` (one line by contract) and the `fix` is checked for the ESC and CR specifically.
    assert.equal(hasControl(f.name), false, `the finding name still carries a control character: ${JSON.stringify(f.name)}`);
    // Asserted with `includes`, not a regex: a control-character class inside a regex literal is
    // `no-control-regex`, and the intent reads more plainly as the character itself.
    assert.ok(!f.fix.includes('\u001b'), 'an ESC in the advice lets the name choose its own colour');
    assert.ok(!f.fix.includes('\r'), 'a CR in the advice overwrites what was printed before it');
    // `fix` is multi-line BY CONTRACT — `printResults` indents each line — so the claim is that
    // the name contributes no control character, not that the string holds none. Removing the
    // structural newlines is what separates the two; asserting on the raw string instead was
    // wrong about the code rather than about the name, and said so on the first run.
    assert.equal(hasControl(f.fix.split('\n').join('')), false,
      `the name still contributes a control character to the advice: ${JSON.stringify(f.fix)}`);
    // The fabrication property, stated STRUCTURALLY rather than as a transcribed count. R3: the
    // previous version pinned `length === 11`, which is one sub-branch's current line count — it
    // rejected the addition of a correct advisory line (framing a fix as an attack, training the
    // next author to bump the number) and it did not catch U+2028, where the count stays put
    // while a line is forged for every reader that is not `split('\n')`. What matters is that no
    // line of the advice LOOKS like a finding, under any of the splittings a consumer may use.
    const lines = f.fix.split(/\r\n|\r|\n|\u2028|\u2029|\u0085/);
    for (const l of lines) {
      assert.doesNotMatch(l, /^\s*[✓✗⚠]/,
        `a line of the advice begins like a finding, so a name can forge one: ${JSON.stringify(l)}`);
    }
    // The escape must be visible, not silently dropped — a dropped newline would make two
    // different directory names render identically.
    assert.match(f.name, /legit\\n/, 'the control character must be shown as an escape, not deleted');
  });

  // R3: the control-character test above covers Category 2 only, and removing `displaySafe` from
  // the other four categories survived the whole suite. Those read their fields from the CSV, not
  // from a directory name, and `readExistingCsv` preserves CRLF inside a quoted field per
  // RFC 4180 — so a control character is reachable there by a different route entirely.
  it('escapes a control character that arrives from the REGISTRY, not from a directory name', async () => {
    const { hasDangerousCodePoint } = require('../../scripts/lib/sanitize');
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-csvctrl-'));
    await buildTmpProject([]).then(() => {});
    await fs.ensureDir(path.join(tmpRoot, '.claude', 'skills'));
    // A quoted field holding a newline: valid RFC 4180, preserved by the reader, and the skill
    // directory is absent so this lands in `[missing-target]` / `[stale:skill-gone]`.
    const csvPath = path.join(tmpRoot, '_bmad', '_config', 'bmm-dependencies.csv');
    await fs.ensureDir(path.dirname(csvPath));
    await fs.writeFile(csvPath,
      `${CSV_HEADER}\n"gone\n  ✓ BMM dependencies: registry consistent",bmad-agent-pm,frontmatter,bmm,auto-scan,2026-01-01\n`,
      'utf8');
    const findings = checkBmmDependencies(tmpRoot).filter(r => !r.passed);
    assert.ok(findings.length > 0, `fixture: expected a finding; got ${JSON.stringify(findings)}`);
    for (const f of findings) {
      assert.equal(hasDangerousCodePoint(f.name), false,
        `a registry field put a control character in a finding name: ${JSON.stringify(f.name)}`);
      assert.equal(hasDangerousCodePoint(String(f.warning ?? '')), false,
        `...or in its warning: ${JSON.stringify(f.warning)}`);
    }
  });

  // ── R3: the two HIGHs, and the clauses nothing bound ──

  // R3 HIGH: the per-skill branch refuses an unadvisable name; the SUMMARY branch did not, so it
  // was the live route to the same trap. Measured: ten unregistered skills, one `-dash-skill`,
  // following this branch's advice verbatim printed `✓ Registered`, wrote `'-dash-skill`, left the
  // finding standing and added a `[missing-target]` — after which no shipped command clears it.
  it('warns in the SUMMARY branch when some names cannot be passed to the command', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-sumgate-'));
    for (let i = 0; i < BMM_DRIFT_SUMMARY_THRESHOLD - 1; i += 1) {
      await seedCustomSkill(tmpRoot, `plain-skill-${i}`, 'bmad-agent-pm');
    }
    await seedCustomSkill(tmpRoot, '-dash-skill', 'bmad-agent-pm');
    await seedCsv(tmpRoot, []);
    const summary = checkBmmDependencies(tmpRoot).find(r => r.name.includes('unregistered-custom-skill ('));
    assert.ok(summary, 'fixture: expected the summary branch to fire');
    assert.match(summary.fix, /1 of these \d+ cannot be passed to convoke-register-skill/,
      'the summary must say how many of the batch the command cannot carry');
    assert.match(summary.fix, /registering reports success and leaves\n?\s*this finding standing/,
      'and what happens if the operator tries anyway');
  });

  // ...and it must stay quiet when every name IS advisable, or the warning is noise that trains
  // the operator to ignore it.
  it('says nothing about unadvisable names in the SUMMARY branch when every name is advisable', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-sumclean-'));
    for (let i = 0; i < BMM_DRIFT_SUMMARY_THRESHOLD; i += 1) {
      await seedCustomSkill(tmpRoot, `plain-skill-${i}`, 'bmad-agent-pm');
    }
    await seedCsv(tmpRoot, []);
    const summary = checkBmmDependencies(tmpRoot).find(r => r.name.includes('unregistered-custom-skill ('));
    assert.ok(summary);
    assert.doesNotMatch(summary.fix, /cannot be passed to convoke-register-skill/);
  });

  // R3 HIGH: `mv -- src existing-dir` NESTS rather than renames, exit 0, nothing warns — and
  // `_grepStepFilesForAgents` then reads the nested SKILL.md, so every dependency claim of the
  // third-party skill, including a prose-only mention, transfers to the operator's own skill,
  // which this very check then advises them to register under their own name. Measured.
  it('guards the rename command so it cannot nest the skill inside an existing directory', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-nest-'));
    await seedCustomSkill(tmpRoot, '-dash-skill', 'bmad-agent-pm');
    await seedCsv(tmpRoot, []);
    const unreg = checkBmmDependencies(tmpRoot).find(r => r.name.includes('[unregistered]'));
    assert.ok(unreg);
    assert.match(unreg.fix, /test ! -e \.claude\/skills\/<new-name> && mv -- /,
      'an unguarded mv nests into an existing target instead of renaming');
    assert.match(unreg.fix, /must not already exist/,
      'and the constraint has to be stated, not just encoded in the command');
  });

  // R3: `hasControlChar` was bound by nothing — forcing it true survived the whole suite, telling
  // every renamed skill its name "contains a character that cannot be pasted", which is false for
  // the common members of that class (`-dash-skill`, `my-skill `, `=eq`, `a..b`).
  it('offers the pasteable rename for a name whose only problem is its shape', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-pasteable-'));
    await seedCustomSkill(tmpRoot, '-dash-skill', 'bmad-agent-pm');
    await seedCsv(tmpRoot, []);
    const unreg = checkBmmDependencies(tmpRoot).find(r => r.name.includes('[unregistered]'));
    assert.match(unreg.fix, /mv -- '\.claude\/skills\/-dash-skill'/, 'the real name, quoted, is pasteable');
    assert.doesNotMatch(unreg.fix, /cannot be pasted/, 'this name CAN be pasted — saying otherwise is false');
    assert.doesNotMatch(unreg.fix, /ls -d/, 'and it needs no glob');
  });

  // R3: a name whose FIRST character is dangerous has an empty printable prefix, and the glob then
  // degenerated to `.claude/skills/*` — with an `mv` after it, which would have moved every skill
  // in the project. That is the one shape where advice is worse than none.
  it('offers no command at all when the name begins with an unpasteable character', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-noprefix-'));
    await seedCustomSkill(tmpRoot, '\u0001leading-ctrl', 'bmad-agent-pm');
    await seedCustomSkill(tmpRoot, 'innocent-bystander', 'bmad-agent-dev');
    await seedCsv(tmpRoot, []);
    const unreg = checkBmmDependencies(tmpRoot).find(r => r.name.includes('leading-ctrl'));
    assert.ok(unreg);
    assert.doesNotMatch(unreg.fix, /mv /, 'no mv may be offered — its source glob would match every skill');
    assert.doesNotMatch(unreg.fix, /\.claude\/skills\/'\*|skills\/\*/, 'and no project-wide glob either');
    assert.match(unreg.fix, /BEGINS with a character that cannot be pasted/);
    assert.match(unreg.fix, /ls \.claude\/skills\/ \| cat -v/, 'it must still say how to SEE the name');
  });

  // R3: the prefix list in the advice is a prose restatement of `_inferSourceModule`. Rewriting it
  // to name only two prefixes survived the suite. Pinned BEHAVIOURALLY — each prefix the advice
  // names must really move the skill out of this category — so the test cannot drift with the prose.
  it('names exactly the prefixes that really move a skill out of this category', async () => {
    const claimed = ['bmad-', 'convoke-', 'wds-', 'q-', 'q0-'];
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-prefix-'));
    await seedCustomSkill(tmpRoot, '-dash-skill', 'bmad-agent-pm');
    await seedCsv(tmpRoot, []);
    const advice = checkBmmDependencies(tmpRoot).find(r => r.name.includes('[unregistered]')).fix;
    for (const p of claimed) {
      const probe = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-prefix-probe-'));
      try {
        await seedCustomSkill(probe, `${p}renamed-skill`, 'bmad-agent-pm');
        await seedCsv(probe, []);
        const hit = checkBmmDependencies(probe).find(r => r.name.includes(`${p}renamed-skill`));
        assert.ok(hit, `fixture: no finding for ${p}renamed-skill`);
        assert.doesNotMatch(hit.name, /\[unregistered]/,
          `the advice warns against ${p} but renaming to it stays in this category`);
        // and the advice must actually mention it, in whichever form (`q0-` is written `q<digit>-`)
        const mentioned = advice.includes(`\`${p}\``) || (/^q\d-$/.test(p) && advice.includes('q<digit>-'));
        assert.ok(mentioned, `renaming to ${p} leaves this category but the advice does not warn about it`);
      } finally { await fs.remove(probe); }
    }
  });

  // T254 R1 MEDIUM-2: the summary branch was rewritten by the same commit and pinned by nothing.
  // It prints no skill, agent or type, so it cannot carry the per-skill command — what it must
  // carry is a way to LIST the triples, and the listing must not be the scanner's write mode:
  // that writes an `auto-scan` row for every one of them, which on any build without T112 refuses
  // the operator's own registration afterwards.
  it('points the summary branch at a listing that does not write the registry', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-sum2-'));
    const many = BMM_DRIFT_SUMMARY_THRESHOLD;
    for (let i = 0; i < many; i += 1) {
      await seedCustomSkill(tmpRoot, `custom-skill-${i}`, 'bmad-agent-pm');
    }
    // A row of a DIFFERENT category, so the category count and the total drift differ. With a
    // single-category fixture `totalDrift === unregisteredCustom.length`, and a summary counting
    // the total instead of the category passed — the composite-vs-component failure mode.
    await seedCsv(tmpRoot, [{
      skill_name: 'bmad-agent-pm', bmm_agent: 'bmad-agent-architect', dependency_type: 'frontmatter',
      source_module: 'bmm', registered_by: 'user@example.com', registered_date: '2026-01-01',
    }]);
    const results = checkBmmDependencies(tmpRoot);
    const summary = results.find(r => r.name.includes('unregistered-custom-skill ('));
    assert.ok(summary, `expected the summary finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.match(summary.name, new RegExp(`\\(${many} findings\\)`));
    assert.match(summary.fix, /convoke-audit-bmm-deps --dry-run/, 'the listing must be dry-run');
    assert.doesNotMatch(summary.fix, /convoke-audit-bmm-deps(?! --dry-run)/,
      'the scanner\'s WRITE mode must not be offered — it creates the rows that block the fix');
    assert.match(summary.fix, /it does not write the registry/,
      'the operator has to be told which of the two scanner modes this is');
    assert.match(summary.fix, /convoke-register-skill/, 'the summary must still name the remedy');
  });
});

// --- AC3 Category 3: missing-scan-target ---

describe('checkBmmDependencies — AC3 missing-scan-target', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [missing-target] finding when CSV row has known-prefix skill absent on disk', async () => {
    tmpRoot = await buildTmpProject([]);
    await seedCsv(tmpRoot, [{
      skill_name: 'bmad-agent-pm', // bmad- prefix → source_module=bmm (known)
      bmm_agent: 'bmad-agent-architect',
      dependency_type: 'frontmatter',
      source_module: 'bmm',
      registered_by: 'user@example.com', // MANUAL so it's not cat 1 stale
      registered_date: '2026-01-01',
    }]);
    const results = checkBmmDependencies(tmpRoot);
    const mt = results.find(r => r.name.includes('[missing-target]'));
    assert.ok(mt, `expected [missing-target] finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(mt.softWarning, true);
    assert.match(mt.name, /bmad-agent-pm/);
  });
});

// --- AC3 Category 4: scan-vs-csv-mismatch ---

// Round 2 R2-1: manual row with `source_module: 'unknown'` whose skill dir
// is absent should NOT fall through all four categories. Post-R2-1, Cat 3's
// predicate no longer filters on source_module, so this scenario now lands
// in missing-scan-target.
describe('checkBmmDependencies — R2-1 Cat 3 covers manual unknown-source row with gone skill', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [missing-target] when manual row has source_module=unknown and skill is gone', async () => {
    tmpRoot = await buildTmpProject([]);
    await seedCsv(tmpRoot, [{
      skill_name: 'deleted-custom-tool',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'user@example.com', // MANUAL (not auto-scan)
      registered_date: '2026-01-01',
    }]);
    const results = checkBmmDependencies(tmpRoot);
    const mt = results.find(r => r.name.includes('[missing-target]'));
    assert.ok(mt,
      `expected [missing-target] finding for manual unknown-source row with absent skill; got: ${results.map(r => r.name).join(', ')}`);
    assert.match(mt.name, /deleted-custom-tool/);
    assert.equal(mt.softWarning, true);
  });
});

describe('checkBmmDependencies — AC3 scan-vs-csv-mismatch', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [drift] finding when scan detects first-party dep absent from CSV', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-drift-'));
    // First-party-prefix skill with a frontmatter dep the scan will detect.
    const skillDir = path.join(tmpRoot, '.claude', 'skills', 'bmad-custom-drift');
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: bmad-custom-drift\ndependencies:\n  - bmad-agent-pm\n---\n',
      'utf8',
    );
    await seedCsv(tmpRoot, []);
    const results = checkBmmDependencies(tmpRoot);
    const drift = results.find(r => r.name.includes('[drift]'));
    assert.ok(drift, `expected [drift] finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(drift.softWarning, true);
    assert.match(drift.name, /bmad-custom-drift/);
  });
});

// --- AC6: scan-failure fail-soft ---

describe('checkBmmDependencies — AC6 scan-failure tolerance', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('returns single fail-soft finding when scan throws (missing .claude/skills/)', async () => {
    // Create the CSV but NOT the .claude/skills/ directory — scan will throw.
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-fail-'));
    await seedCsv(tmpRoot, []);
    const results = checkBmmDependencies(tmpRoot);
    assert.equal(results.length, 1);
    assert.equal(results[0].passed, false);
    assert.equal(results[0].softWarning, true);
    assert.match(results[0].warning, /scan failed/);
    assert.match(results[0].fix, /--dry-run/);
  });
});

// --- AC3 fail-soft: all-clean ---

describe('checkBmmDependencies — all-clean case', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits single passed finding with row counts when scan matches CSV', async () => {
    tmpRoot = await buildTmpProject([]);
    // Scan output will be empty (no skills); seed CSV with header only.
    await seedCsv(tmpRoot, []);
    const results = checkBmmDependencies(tmpRoot);
    assert.equal(results.length, 1);
    assert.equal(results[0].passed, true);
    assert.equal(results[0].softWarning, undefined);
    assert.equal(results[0].name, 'BMM dependencies: registry consistent');
    assert.match(results[0].info, /0 auto-scan \+ 0 manual rows/);
  });
});

// --- AC8: deterministic ordering across runs ---

describe('checkBmmDependencies — AC8 deterministic ordering', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('two back-to-back runs against the same state produce deep-equal output', async () => {
    tmpRoot = await buildTmpProject(['skill-with-removed-dep']);
    await seedCsv(tmpRoot, [
      {
        skill_name: 'skill-with-removed-dep',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      },
      {
        skill_name: 'missing-skill-alpha',
        bmm_agent: 'bmad-agent-architect',
        dependency_type: 'frontmatter',
        source_module: 'bmm',
        registered_by: 'user@example.com',
        registered_date: '2026-01-02',
      },
    ]);
    const run1 = checkBmmDependencies(tmpRoot);
    const run2 = checkBmmDependencies(tmpRoot);
    assert.deepEqual(run1, run2, 'doctor output must be stable for CI use');
  });
});

// --- AC9 case 10: scan stderr suppressed ---

describe('checkBmmDependencies — scan stderr suppression', () => {
  let tmpRoot;
  let stderrSpy;

  beforeEach(() => {
    stderrSpy = mock.method(console, 'error', () => {});
  });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('does NOT propagate scan tool [FR18] or [stale:*] stderr into doctor output', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    await seedCsv(tmpRoot, [{
      skill_name: 'removed-skill-for-stderr-test',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-01-01',
    }]);
    checkBmmDependencies(tmpRoot);
    // No finding's name, warning, or fix should echo the scan tool's stderr.
    // The spy captures any console.error calls that escape suppression.
    const stderrCalls = stderrSpy.mock.calls.map(c => c.arguments.join(' '));
    const hasFr18 = stderrCalls.some(l => l.includes('[FR18]'));
    const hasStaleScan = stderrCalls.some(l => l.includes('[stale:skill-gone]') || l.includes('[stale:dep-removed]'));
    assert.equal(hasFr18, false,
      `scan tool [FR18] stderr leaked into doctor output: ${stderrCalls.join(' || ')}`);
    assert.equal(hasStaleScan, false,
      `scan tool [stale:*] stderr leaked: ${stderrCalls.join(' || ')}`);
  });
});

// --- AC7a: summary mode when drift count exceeds threshold ---

describe('checkBmmDependencies — AC7a summary-mode threshold', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('collapses into single summary finding when stale-autoscan count ≥ threshold', async () => {
    tmpRoot = await buildTmpProject([]);
    // Seed CSV with ≥ threshold auto-scan rows referencing absent skills.
    const rows = [];
    for (let i = 0; i < BMM_DRIFT_SUMMARY_THRESHOLD + 1; i++) {
      rows.push({
        skill_name: `gone-skill-${i.toString().padStart(2, '0')}`,
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      });
    }
    await seedCsv(tmpRoot, rows);
    const results = checkBmmDependencies(tmpRoot);
    // Exactly one finding for stale-autoscan category (summary mode), not N.
    const staleFindings = results.filter(r => r.name.includes('stale-autoscan') || r.name.includes('stale:'));
    assert.equal(staleFindings.length, 1,
      `expected single summary finding; got ${staleFindings.length}: ${staleFindings.map(r => r.name).join(', ')}`);
    assert.match(staleFindings[0].name, /stale-autoscan \(\d+ findings\)/);
    assert.equal(staleFindings[0].softWarning, true);
    assert.match(staleFindings[0].warning, /stale entries detected/);
  });

  // Boundary test (Round 1 M1): assert the threshold is `>= 10` (exactly 10
  // triggers summary). Protects against future "should be > 10" re-interpretation.
  it('uses >= threshold semantics: exactly THRESHOLD findings collapses to summary', async () => {
    tmpRoot = await buildTmpProject([]);
    const rows = [];
    for (let i = 0; i < BMM_DRIFT_SUMMARY_THRESHOLD; i++) {
      rows.push({
        skill_name: `gone-skill-boundary-${i.toString().padStart(2, '0')}`,
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      });
    }
    await seedCsv(tmpRoot, rows);
    const results = checkBmmDependencies(tmpRoot);
    const staleFindings = results.filter(r => r.name.includes('stale-autoscan') || r.name.includes('stale:'));
    assert.equal(staleFindings.length, 1,
      'at EXACTLY threshold (10), summary mode should activate (>= semantics)');
    assert.match(staleFindings[0].name, /stale-autoscan \(\d+ findings\)/);
  });

  // Round 2 R2-4: exercises the tertiary `dependency_type` sort key in
  // `_bmmRowCmp`. Without this coverage, a future regression that removes the
  // tertiary key would leave all other tests green. Two rows share
  // (skill_name, bmm_agent) but differ in dependency_type — asserts they
  // appear in a determined order (alphabetical: 'code-reference' < 'frontmatter').
  it('sorts deterministically when two rows share (skill, agent) but differ in dependency_type', async () => {
    tmpRoot = await buildTmpProject([]);
    await seedCsv(tmpRoot, [
      {
        skill_name: 'multi-type-skill',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      },
      {
        skill_name: 'multi-type-skill',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'code-reference',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      },
    ]);
    const results = checkBmmDependencies(tmpRoot);
    // Both rows will hit Cat 1 (stale skill-gone) since the skill dir is
    // absent. Assert their relative order matches the tertiary sort rule:
    // 'code-reference' < 'frontmatter' alphabetically.
    const staleFindings = results.filter(r => r.name.includes('multi-type-skill'));
    assert.equal(staleFindings.length, 2);
    // Name format embeds "[stale:skill-gone] <skill_name> → <agent>" — both rows
    // have identical names, so ordering within the results array is the thing
    // under test. Verify via consecutive-order + deepEqual stability.
    const run2 = checkBmmDependencies(tmpRoot);
    assert.deepEqual(
      results.map(r => ({ name: r.name, dep_type_hint: r.warning })),
      run2.map(r => ({ name: r.name, dep_type_hint: r.warning })),
      'ordering must be deterministic across runs even when rows share (skill, agent)',
    );
  });

  it('uses < threshold semantics: one below threshold emits individual findings', async () => {
    tmpRoot = await buildTmpProject([]);
    const rows = [];
    for (let i = 0; i < BMM_DRIFT_SUMMARY_THRESHOLD - 1; i++) {
      rows.push({
        skill_name: `gone-skill-below-${i.toString().padStart(2, '0')}`,
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      });
    }
    await seedCsv(tmpRoot, rows);
    const results = checkBmmDependencies(tmpRoot);
    const staleFindings = results.filter(r => r.name.includes('stale:'));
    assert.equal(staleFindings.length, BMM_DRIFT_SUMMARY_THRESHOLD - 1,
      `below threshold should emit individual findings; got ${staleFindings.length}`);
  });
});

// --- Governance findings never use `error:` field (AC3) ---

describe('checkBmmDependencies — AC3 fail-soft contract (no error field)', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('never emits an `error` field — governance findings are always fail-soft', async () => {
    // Exercise every branch: CSV absent, stale, unregistered, missing-target, drift.
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-nofail-'));
    // Create a custom skill that scan will detect.
    const customDir = path.join(tmpRoot, '.claude', 'skills', 'custom-x');
    await fs.ensureDir(customDir);
    await fs.writeFile(
      path.join(customDir, 'SKILL.md'),
      '---\nname: custom-x\ndependencies:\n  - bmad-agent-pm\n---\n',
      'utf8',
    );
    await seedCsv(tmpRoot, [
      // Will be cat 1 (stale-autoscan, skill-gone).
      {
        skill_name: 'ghost-skill',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      },
      // Will be cat 3 (missing-scan-target).
      {
        skill_name: 'bmad-agent-missing',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'bmm',
        registered_by: 'user@example.com',
        registered_date: '2026-01-01',
      },
    ]);
    const results = checkBmmDependencies(tmpRoot);
    results.forEach(r => {
      if (!r.passed) {
        assert.equal(r.error, undefined,
          `governance finding should never carry 'error' field: ${JSON.stringify(r)}`);
        assert.equal(r.softWarning, true,
          `every failed governance finding must set softWarning: ${JSON.stringify(r)}`);
      }
    });
  });
});
