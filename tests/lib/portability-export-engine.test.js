'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { FIXTURE_ROOT } = require('./portability-fixture');
const { exportSkill, ALLOWED_WARNING_TYPES, isExportableTier } = require('../../scripts/portability/export-engine');

// Story sp-2-2: Export Engine
//
// Validates that the export engine produces canonical instructions.md content
// matching the format spec from sp-2-1, for both Carson (Tier 1, strategy 2
// persona resolution) and Winston (Tier 1, strategy 1 persona resolution).

const { FORBIDDEN_STRINGS } = require('../../scripts/portability/test-constants');


const REQUIRED_HEADING_PATTERNS = [
  /^# /m, // Title (any H1 — engine generates "# X with Y" or "# X")
  /^## You are /m,
  /^## When to use this skill$/m,
  /^## Inputs you may need$/m,
  /^## How to proceed$/m,
  /^## What you produce$/m,
];

/** Warnings about transforming the instructions, without T259's list of files not carried. */
function transformationWarnings(result) {
  return result.warnings.filter((w) => w.type !== 'source-file-not-exported');
}

/**
 * Shared structural-invariant assertions per AC #8 + #9.
 */
function assertStructuralInvariants(result, expectedName, expectedIcon) {
  // 1. Result has all 4 keys
  assert.notStrictEqual(result['instructions'], undefined);
  assert.notStrictEqual(result['persona'], undefined);
  assert.notStrictEqual(result['sections'], undefined);
  assert.notStrictEqual(result['warnings'], undefined);
  assert.equal(typeof result.instructions, 'string');
  assert.ok(result.instructions.length > 0);

  // 2. All required section headings present in correct order
  // Use RegExp.exec().index instead of indexOf(m[0]) — sp-2-1 P2 fix
  const positions = REQUIRED_HEADING_PATTERNS.map((pattern) => {
    const re = new RegExp(pattern.source, pattern.flags);
    const match = re.exec(result.instructions);
    if (!match) {
      throw new Error(
        `Required section heading ${pattern} not found in instructions for ${expectedName}`
      );
    }
    return match.index;
  });
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] <= positions[i - 1]) {
      throw new Error(
        `Section heading ${i + 1} (pattern ${REQUIRED_HEADING_PATTERNS[i]}) ` +
        `appears at offset ${positions[i]}, which is not after section ${i} ` +
        `(at offset ${positions[i - 1]}) for ${expectedName}.`
      );
    }
  }

  // 3. Zero forbidden strings
  const violations = [];
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (result.instructions.includes(forbidden)) {
      violations.push(forbidden);
    }
  }
  if (violations.length > 0) {
    console.error(`${expectedName} export contains forbidden strings:`, violations);
  }
  assert.deepEqual(violations, []);

  // 4. Zero curly-brace placeholders (per sp-2-1 P3 — all should be substituted)
  const placeholderRegex = /\{[\w_-]+\}/g;
  const placeholders = result.instructions.match(placeholderRegex) || [];
  if (placeholders.length > 0) {
    console.error(`${expectedName} export contains unsubstituted placeholders:`, placeholders);
  }
  assert.deepEqual(placeholders, []);

  // 5. Persona name + icon match
  assert.equal(result.persona.name, expectedName);
  assert.equal(result.persona.icon, expectedIcon);

  // 6. Persona name appears in instructions text
  assert.ok(result.instructions.includes(expectedName));

  // 7. transformation warnings <= 2. T259's `source-file-not-exported` reports what the skill ships
  // beside its instructions, not a loss in transforming them, so it is outside this budget and
  // asserted by name in the T259 block.
  const lossy = transformationWarnings(result);
  if (lossy.length > 2) {
    console.error(`${expectedName} produced ${lossy.length} transformation warnings:`, lossy);
  }
  assert.ok(lossy.length <= 2);

  // 8. All warning types are in the allowed set
  for (const warning of result.warnings) {
    assert.equal(ALLOWED_WARNING_TYPES.has(warning.type), true);
  }
}


/** Reads the engine's own source. Source-shape assertions below explain why. */
function readEngineSource() {
  return fs.readFileSync(
    path.join(__dirname, '..', '..', 'scripts', 'portability', 'export-engine.js'),
    'utf8'
  );
}

describe('Export engine (sp-2-2)', () => {
  // Backlog I123: was `findProjectRoot()` inside a `before()`, i.e. the LIVE repo. An upstream
  // BMAD update deleted the skill content it depended on and quarantined this whole suite for
  // ~6 weeks. Now a committed fixture, per `test-fixture-isolation`.
  const projectRoot = FIXTURE_ROOT;

  it('Test 1: bmad-brainstorming (Carson) satisfies all structural invariants', () => {
    const result = exportSkill('bmad-brainstorming', projectRoot);
    assertStructuralInvariants(result, 'Carson', '🧠');
  });

  it('Test 2: bmad-agent-architect (Winston) satisfies all structural invariants — Fix 1 second fixture', () => {
    const result = exportSkill('bmad-agent-architect', projectRoot);
    assertStructuralInvariants(result, 'Winston', '🏗️');
  });

  it('Test 3: bmad-create-prd (Tier 2 light-deps) exports successfully', () => {
    const result = exportSkill('bmad-create-prd', projectRoot);
    assert.notStrictEqual(result, undefined);
    assert.ok(result.instructions.length > 0);
    assert.ok(result.instructions.includes('## You are'));
  });

  it('Test 4: bmad-dev-story (Tier 3 pipeline) is refused, not exported (T186)', () => {
    // It used to export the full persona and procedure under a "framework-only" banner, which reads
    // as usable and is not. Operator ruling 2026-10-28: refuse it, for every caller.
    assert.throws(() => exportSkill('bmad-dev-story', projectRoot), /tier "pipeline"/);
  });

  it('Test 5: nonexistent skill throws a helpful error', () => {
    assert.throws(() => {
      exportSkill('bmad-skill-that-does-not-exist', projectRoot);
    }, /not in the manifest/i);
  });

  it('Test 6: engine is read-only (fixture tree byte-identical before/after)', () => {
    // Was `git status --porcelain` against the live repo, wrapped in try/catch + two
    // early-returns for "git unavailable" and "tree already dirty". Against the fixture that
    // check is worse than useless: the fixture is not a git repo, so `git status` reports on
    // the PARENT repo, and the "tree already dirty" guard silently returns during any session
    // with uncommitted work — which is most of them. The test could pass without exercising
    // anything. Hash the fixture tree instead: no early exit, and it fails if the engine
    // writes so much as a byte.
    const snapshot = () => {
      const out = [];
      const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) walk(full);
          else out.push(`${path.relative(projectRoot, full)}:${crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')}`);
        }
      };
      walk(projectRoot);
      return out.join('\n');
    };
    const before = snapshot();
    assert.ok(before.length > 0, 'fixture tree is empty — the assertion below would be vacuous');
    exportSkill('bmad-brainstorming', projectRoot);
    assert.equal(snapshot(), before, 'exportSkill mutated the project tree — the engine must be read-only');
  });

  it('Test 7: Carson produces <= 2 transformation warnings, all of allowed types', () => {
    const result = exportSkill('bmad-brainstorming', projectRoot);
    assert.ok(transformationWarnings(result).length <= 2);
    for (const warning of result.warnings) {
      assert.equal(ALLOWED_WARNING_TYPES.has(warning.type), true);
    }
  });

  it('Test 8: Winston produces <= 2 transformation warnings, all of allowed types', () => {
    const result = exportSkill('bmad-agent-architect', projectRoot);
    assert.ok(transformationWarnings(result).length <= 2);
    for (const warning of result.warnings) {
      assert.equal(ALLOWED_WARNING_TYPES.has(warning.type), true);
    }
  });

  it('Test 9: Carson result.sections has all 7 expected keys', () => {
    const result = exportSkill('bmad-brainstorming', projectRoot);
    const expectedKeys = [
      'title',
      'persona',
      'whenToUse',
      'inputs',
      'howToProceed',
      'whatYouProduce',
      'qualityChecks',
    ];
    for (const key of expectedKeys) {
      assert.notStrictEqual(result.sections[key], undefined);
    }
  });

  it('Test 10: Phase 6 substitution-loop ordering invariant (BUG-7 R1 P5)', () => {
    // Carson source contains 3× {{user_name}} double-brace patterns. The double-brace
    // loop MUST run before the single-brace loop in export-engine.js Phase 6 — otherwise
    // single-brace matches the inner {var} of {{var}} first, leaves residual `{your-name}`,
    // and the catch-all then matches `your-name` (because `-` is in `[\w_-]+`) emitting
    // a spurious 'unresolved-template-path' warning. This test locks the ordering.
    const result = exportSkill('bmad-brainstorming', projectRoot);
    // Substitution must produce hyphenated form for {{user_name}} occurrences
    assert.ok(
      result.instructions.includes('your-name'),
      'configVarMap substitution must produce your-name from {{user_name}} patterns'
    );
    // No residual {your-X} brace artifacts (the loop-order failure mode)
    const residual = result.instructions.match(/\{your-[\w-]+\}/g);
    assert.strictEqual(
      residual,
      null,
      `Phase 6 must not leave residual brace-wrapped your-X tokens; found: ${residual}`
    );
    // Catch-all must NOT have warned for any your-X residue (else loop reorder regressed)
    const yourXWarnings = result.warnings.filter((w) =>
      /unmapped config var \{your-/.test(w.message || '')
    );
    assert.strictEqual(
      yourXWarnings.length,
      0,
      `Catch-all must not warn for your-X residue; found: ${JSON.stringify(yourXWarnings)}`
    );
  });
});

// --- T33: unescaped interpolation into constructed RegExps ---
//
// Two sites built a RegExp by interpolating a string without escaping it:
// the persona-icon match (`u` flag) and `extractSectionByHeading` (`mi` flags).
//
// The backlog row claimed "a brace in a persona name crashes the export". That
// premise is FALSE and was measured before this fix shipped: `extractInlinePersona`
// derives the name from /^#\s+([A-Z][a-zA-Z]+)\s*$/, a letters-only capture, so
// `# Emma {V}` does not match at all and no metacharacter can reach the RegExp;
// and every caller of `extractSectionByHeading` passes a hardcoded literal.
// Both sites are therefore DEFENSIVE — escaped because the helper exists and the
// failure modes are ugly (a hard SyntaxError under `u`, a silent null under `mi`),
// not because either is reachable today. These tests pin the escaping AND the
// reachability facts, so a future widening of either input source is caught.

describe('T33 — RegExp interpolation is escaped at both sites', () => {
  const { escapeRegExp } = require('../../scripts/lib/sanitize');

  it('escaping makes the u-flag icon pattern survive a brace', () => {
    const raw = () => new RegExp(`#\\s+${'Emma {V}'}\\s*([\\p{Emoji}])`, 'u');
    assert.throws(raw, SyntaxError, 'fixture no longer exercises the u-flag crash');
    assert.doesNotThrow(
      () => new RegExp(`#\\s+${escapeRegExp('Emma {V}')}\\s*([\\p{Emoji}])`, 'u')
    );
  });

  it('escaping fixes the silent-null heading case under mi flags', () => {
    const body = '## Intro (v2)\nreal body\n\n## Next\nother\n';
    const build = (h) =>
      new RegExp(`^##\\s+${h}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'mi');
    assert.equal(body.match(build('Intro (v2)')), null, 'fixture no longer exercises the gap');
    const m = body.match(build(escapeRegExp('Intro (v2)')));
    assert.ok(m, 'escaped heading must match');
    assert.equal(m[1].trim(), 'real body');
  });

  // Source-shape assertions, and the reason they are source-shape.
  //
  // The three tests above prove `escapeRegExp` solves the problem; they do NOT
  // prove production uses it — verified: all of them pass against the pre-fix
  // engine. That is the "check that cannot fail" class, and it is unavoidable at
  // runtime here, because the finding IS that neither site is reachable with a
  // metacharacter: the persona name is letters-only by construction and every
  // heading caller passes a literal. With no way to drive hostile input through
  // the real path, the honest discriminator is the shape of the call itself.
  it('the icon RegExp interpolates through escapeRegExp', () => {
    const src = readEngineSource();
    assert.match(src, /new RegExp\(\s*`#\\\\s\+\$\{escapeRegExp\(name\)\}/,
      'the u-flag icon pattern must escape `name`');
    assert.doesNotMatch(src, /new RegExp\(`#\\\\s\+\$\{name\}/,
      'raw `name` interpolation has come back');
  });

  it('extractSectionByHeading interpolates through escapeRegExp', () => {
    const src = readEngineSource();
    assert.match(src, /\$\{escapeRegExp\(headingName\)\}/,
      'the heading pattern must escape `headingName`');
    assert.doesNotMatch(src, /\^##\\\\s\+\$\{headingName\}/,
      'raw `headingName` interpolation has come back');
  });

  // Reachability, pinned. If either assertion breaks, the sites stop being
  // defensive and T33's original severity becomes real.
  it('the persona-name regex still admits letters only', () => {
    // Built FROM the source text, not copied alongside it. A local
    // `const NAME_RE = /.../` would keep passing against its own fork after
    // someone widened the real capture — the exact rot this pin exists to catch.
    const src = readEngineSource();
    const decl = src.match(/lines\[i\]\.match\((\/\^#.*?\/)\);/);
    assert.ok(decl, 'the persona-name capture moved; this pin no longer reads it');
    const NAME_RE = new RegExp(decl[1].slice(1, -1));
    assert.match(decl[1], /\(\[A-Z\]\[a-zA-Z\]\+\)/,
      'the capture is no longer letters-only — the RegExp sites are now reachable');
    assert.equal(NAME_RE.exec('# Emma')[1], 'Emma');
    for (const hostile of ['# Emma {V}', '# Emma (V)', '# Emma-Q', '# Emma.Q', '# Emma*']) {
      assert.equal(NAME_RE.exec(hostile), null, `name regex admitted ${hostile}`);
    }
  });

  it('every extractSectionByHeading caller still passes a literal', () => {
    const src = readEngineSource();
    // Exclude the definition line — `function extractSectionByHeading(content,
    // headingName)` otherwise matches and its parameter reads as an argument.
    const calls = [...src.matchAll(/(function\s+)?extractSectionByHeading\(\s*[A-Za-z_$][\w$]*\s*,\s*([^)]+)\)/g)]
      .filter((m) => !m[1])
      .map((m) => m[2].trim());
    // Divergence is the signal: a call whose first argument is an expression
    // rather than a bare identifier does not match the parser above and would
    // otherwise slip through unexamined while the five literal calls keep the
    // count green. Compare parsed calls against raw occurrences instead.
    const raw = [...src.matchAll(/extractSectionByHeading\(/g)].length;
    const defs = [...src.matchAll(/function\s+extractSectionByHeading\(/g)].length;
    assert.equal(calls.length, raw - defs,
      `${raw - defs - calls.length} call site(s) did not parse — the pin cannot see them`);
    assert.ok(calls.length >= 5, `expected the known call sites, found ${calls.length}`);
    for (const arg of calls) {
      assert.match(arg, /^'[^']*'$/, `non-literal heading argument reaches the RegExp: ${arg}`);
    }
  });
});

// --- dist-2-7: the last two unescaped interpolations (FR16) ---
//
// `applyTransformations` builds `{{var}}` and `{var}` matchers by interpolating `varName` from
// `Object.entries(CONFIG_VAR_MAP)`. FR16 requires EVERY interpolated RegExp in this file to escape
// its value, and the 2026-09-07 operator ruling confirmed that includes provably-safe sites.
//
// NOTHING CRASHES HERE, and saying otherwise would repeat the overclaim T33 was rescored 7.2 -> 1.9
// for. `configVarMap` is a hardcoded literal whose six keys are all /^[a-z_]+$/, referenced only by
// its own declaration and the two loops. The escape is uniformity: "every interpolation is escaped"
// is a rule a grep can confirm, while "every one except the safe ones" needs a per-site argument
// that expires silently the day a key gains a `.` or a `-`.
//
// Three categories, mirroring the T33 block above, for the reasons stated there.

describe('dist-2-7 — CONFIG_VAR_MAP interpolation is escaped', () => {
  const { escapeRegExp, escapeReplacement } = require('../../scripts/lib/sanitize');

  // 1. ISOLATION. Proves escapeRegExp fixes the construct. Passes against pre-fix code, so it is
  //    NOT the discriminator — same caveat T33 records about its own isolation tests.
  it('escaping makes a metacharacter key match literally', () => {
    const body = 'a {{a.c}} b';
    const raw = new RegExp(`\\{\\{${'a.c'}\\}\\}`, 'g');
    const esc = new RegExp(`\\{\\{${escapeRegExp('a.c')}\\}\\}`, 'g');
    assert.equal('a {{abc}} b'.replace(raw, 'X'), 'a X b', 'fixture no longer exercises the gap');
    assert.equal('a {{abc}} b'.replace(esc, 'X'), 'a {{abc}} b', 'escaped form must not match abc');
    assert.equal(body.replace(esc, 'X'), 'a X b', 'escaped form must match the literal key');
  });

  // 2. SOURCE SHAPE. This is the half that fails on a revert.
  // THE IDENTIFIER IS CAPTURED FROM THE LOOP, NOT ASSUMED. An earlier version of these assertions
  // matched the literal `varName`, which false-failed on a harmless rename; the fix for that
  // matched ANY identifier, which then could not tell `escapeRegExp(varName)` from
  // `escapeRegExp(replacement)` — the wrong half of the same destructured pair, a real regression
  // that leaves the key raw. Delta review proved it: that mutation kept these tests green and was
  // caught only by an unrelated functional test. So the loop header is parsed for the KEY binding
  // and the same identifier is then required inside the RegExp — rename-tolerant and
  // wrong-identifier-proof at once. `\s*` after `new RegExp(` keeps the line-wrap tolerance the
  // sibling T33 assertion already has.

  /** The key binding from `for (const [key, value] of Object.entries(CONFIG_VAR_MAP))`. */
  function loopKeyBinding(src) {
    const m = src.match(
      /for \(const \[([A-Za-z_$][\w$]*), *([A-Za-z_$][\w$]*)\] of Object\.entries\(CONFIG_VAR_MAP\)\)/
    );
    assert.ok(m, 'the CONFIG_VAR_MAP loop header was not found — it may have been restructured');
    return { key: m[1], value: m[2] };
  }
  it('the double-brace matcher escapes THE KEY, not merely some identifier', () => {
    const src = readEngineSource();
    const { key } = loopKeyBinding(src);
    assert.match(src, new RegExp(`new RegExp\\(\\s*\`\\\\\\\\\\{\\\\\\\\\\{\\$\\{escapeRegExp\\(${key}\\)\\}`),
      `the {{var}} matcher must escape \`${key}\`, the key bound by the loop`);
    assert.doesNotMatch(src, /new RegExp\(\s*`\\\\\{\\\\\{\$\{[A-Za-z_$][\w$]*\}/,
      'a raw interpolation has come back in the double-brace matcher');
  });

  it('the single-brace matcher escapes THE KEY, not merely some identifier', () => {
    const src = readEngineSource();
    const { key } = loopKeyBinding(src);
    assert.match(src, new RegExp(`new RegExp\\(\\s*\`\\\\\\\\\\{\\$\\{escapeRegExp\\(${key}\\)\\}\\\\\\\\\\}\``),
      `the {var} matcher must escape \`${key}\`, the key bound by the loop`);
    assert.doesNotMatch(src, /new RegExp\(\s*`\\\\\{\$\{[A-Za-z_$][\w$]*\}\\\\\}`/,
      'a raw interpolation has come back in the single-brace matcher');
  });

  // 2b. THE REPLACEMENT SIDE, ruled 2026-09-07 as FR16's symmetric question.
  //     Escaping the pattern is half the job: `$&`, `` $` ``, `$'` and `$1` are live in a
  //     replacement string. Unreachable today (all six values are hardcoded literals with no `$`)
  //     and escaped anyway, for the same reason the pattern side is — so no reachability pin is
  //     needed here: an unconditional escape has no safety argument to keep true.
  it('escaping the replacement stops $& re-injecting the match', () => {
    const raw = 'x{{k}}y'.replace(/\{\{k\}\}/g, 'A$&B');
    const esc = 'x{{k}}y'.replace(/\{\{k\}\}/g, escapeReplacement('A$&B'));
    assert.equal(raw, 'xA{{k}}By', 'fixture no longer exercises $& re-injection');
    assert.equal(esc, 'xA$&By', 'escaped replacement must insert the literal text');
  });

  // WHAT THIS GUARANTEES, precisely: that the two known `result.replace(re, …)` call sites stay
  // escaped and keep using the loop's own value binding. It is scoped to that literal call shape,
  // matching the convention of the T33 block above — a future call written against a different
  // receiver (`text.replace(re, …)`) would be invisible to it. Named because the test's title
  // could otherwise be read as a whole-function guarantee, which it is not.
  it('both loops escape THE VALUE, not merely some identifier', () => {
    const src = readEngineSource();
    const { value } = loopKeyBinding(src);
    const calls = [...src.matchAll(/result\.replace\(re, *([^)]*\)?[^)]*)\)/g)].map((m) => m[1]);
    assert.equal(calls.length, 2, `expected the two config-var replace calls, found ${calls.length}`);
    for (const c of calls) {
      assert.equal(c, `escapeReplacement(${value})`,
        `replacement must be escaped and must be the loop's value binding, got: ${c}`);
    }
  });

  // 3. REACHABILITY PIN. The ruling rests on the map being closed; this is what enforces it.
  //
  //    READS THE REAL OBJECT. Two earlier versions parsed the source text of the object literal —
  //    first bare identifiers, then quoted forms too. Round 1 review defeated the second with
  //    computed keys (`[k]:`), backtick keys, escaped quotes inside quoted keys, empty-string
  //    keys, spread syntax, and a plain post-declaration `MAP['bad.key'] = …` that
  //    `Object.entries` picks up at runtime and a source parser never sees. Each patch was one
  //    syntactic step behind the next bypass, which is exactly the "two failed attempts predict a
  //    third" clause in `code-review-convergence`. So the instrument changed instead: the map was
  //    hoisted to module scope and exported, and this reads `Object.keys` of the actual object.
  //    That is true by construction for every key syntax at once, and cannot rot.
  it('every CONFIG_VAR_MAP key is still metacharacter-free', () => {
    const { CONFIG_VAR_MAP } = require('../../scripts/portability/export-engine');
    const keys = Object.keys(CONFIG_VAR_MAP);
    assert.ok(keys.length >= 6, `expected the known keys, found ${keys.length}`);
    for (const k of keys) {
      assert.match(k, /^[a-z_]+$/,
        `CONFIG_VAR_MAP key "${k}" can reach a RegExp — the safety argument in dist-2-7 no longer holds`);
    }
  });
});

describe('T186: which skills may be exported, and what a refusal says', () => {
  const os = require('os');
  const { readManifest } = require('../../scripts/portability/manifest-csv');
  // A copy of the fixture project with extra manifest rows; a refusal happens before any skill file
  // is read, so the rows may point anywhere.
  function projectWith(extraRows) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 't186-'));
    fs.cpSync(FIXTURE_ROOT, dir, { recursive: true });
    const manifest = path.join(dir, '_bmad', '_config', 'skill-manifest.csv');
    fs.appendFileSync(manifest, extraRows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n') + '\n');
    return dir;
  }
  const row = (name, module, tier) => [name, name, 'synthetic', module, '_bmad/x/SKILL.md', 'true', tier, 'discover-product-fit', ''];

  it('exports only standalone and light-deps, whatever their case or spacing', () => {
    for (const t of ['standalone', 'light-deps', 'Standalone', ' LIGHT-DEPS ']) assert.equal(isExportableTier(t), true, t);
    for (const t of ['pipeline', 'Pipeline', '', undefined, null, 'standlone']) assert.equal(isExportableTier(t), false, String(t));
  });

  it('names the framework a non-Convoke pipeline skill belongs to, not Convoke', () => {
    const { header, rows } = readManifest(path.join(FIXTURE_ROOT, '_bmad', '_config', 'skill-manifest.csv'));
    const module = rows.find((r) => r[header.indexOf('name')] === 'bmad-dev-story')[header.indexOf('module')];
    assert.notEqual(module, 'bme', 'fixture: bmad-dev-story is not a Convoke skill');
    assert.throws(() => exportSkill('bmad-dev-story', FIXTURE_ROOT), (err) =>
      err.message.includes(`module "${module}"`) && !/Convoke/.test(err.message));
  });

  it('tells a Convoke pipeline skill how to install Convoke', () => {
    const dir = projectWith([row('t186-bme-agent', 'bme', 'pipeline')]);
    try {
      assert.throws(() => exportSkill('t186-bme-agent', dir), /tier "pipeline".*npx -p convoke-agents convoke-install/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a tier that is misspelled, empty, or pipeline in another case', () => {
    const dir = projectWith([row('t186-upper', 'bmm', 'Pipeline'), row('t186-empty', 'bmm', ''), row('t186-typo', 'bmm', 'standlone')]);
    try {
      for (const name of ['t186-upper', 't186-empty', 't186-typo']) assert.throws(() => exportSkill(name, dir), /tier "/, name);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// T259 (operator rulings 2026-11-05): the Phase 6 catch-all replaced every unmapped `{variable}`
// with one literal, `your-project-context`, so distinct paths in an exported skill became one name
// and its instructions said the wrong thing ("cp ../template.md your-project-context"). Each
// unmapped variable now gets a name of its own; a brace pair that is not a variable is left alone;
// and source files the export does not carry are reported, not silently dropped.
describe('T259: an export keeps distinct variables distinct and reports what it leaves out', () => {
  const { applyTransformations } = require('../../scripts/portability/export-engine');

  it('two different unmapped variables become two different names, each from its own', () => {
    const warnings = [];
    const out = applyTransformations('cp "../template.md" "{brainstorming_session_output_file}"\nLoad `{templateFile}`', warnings);
    assert.ok(out.includes('"your-brainstorming-session-output-file"'), out);
    assert.ok(out.includes('`your-template-file`'), out);
    assert.ok(!out.includes('your-project-context'), out);
    assert.equal(warnings.filter((w) => w.type === 'unresolved-template-path').length, 2, JSON.stringify(warnings));
  });

  it('a double-brace unmapped variable is named the same way', () => {
    const out = applyTransformations('Session {{sessionId}} for {{user_name}}', []);
    assert.equal(out, 'Session your-session-id for your-name');
  });

  it('a regex quantifier is not a variable and is left as written', () => {
    const warnings = [];
    const out = applyTransformations('Match names with /[a-z]{2}/ and /x{10}/', warnings);
    assert.equal(out, 'Match names with /[a-z]{2}/ and /x{10}/');
    assert.equal(warnings.length, 0, JSON.stringify(warnings));
  });

  it('an exported skill names no variable `your-project-context`', () => {
    const result = exportSkill('bmad-brainstorming', FIXTURE_ROOT);
    assert.ok(!result.instructions.includes('your-project-context'),
      result.instructions.split('\n').filter((l) => l.includes('your-project-context')).slice(0, 3).join('\n'));
    assert.ok(result.instructions.includes('your-brainstorming-session-output-file'));
  });

  it('source files the export does not carry are listed and warned about, inlined ones are not', () => {
    const result = exportSkill('bmad-brainstorming', FIXTURE_ROOT);
    assert.deepEqual([...result.notExported].sort(), ['brain-methods.csv', 'template.md']);
    const w = result.warnings.filter((x) => x.type === 'source-file-not-exported');
    assert.deepEqual(w.map((x) => x.message).sort(), [
      'not included in the export: brain-methods.csv',
      'not included in the export: template.md',
    ]);
    for (const x of result.warnings) assert.equal(ALLOWED_WARNING_TYPES.has(x.type), true, x.type);
  });
  it('a template the export inlines is not listed as left out', () => {
    const result = exportSkill('bmad-create-prd', FIXTURE_ROOT);
    assert.ok(result.instructions.includes('## Template: Prd Template'));
    assert.deepEqual(result.notExported, ['data/']);
  });
});

// T259 Round 1 review remediation.
describe('T259 R1: naming edge cases and what counts as left out', () => {
  const os = require('os');
  const { applyTransformations, exportedVarName, listNotExported } = require('../../scripts/portability/export-engine');

  it('exportedVarName kebab-cases each form, splits acronyms, and never doubles the prefix', () => {
    assert.equal(exportedVarName('templateFile'), 'your-template-file');
    assert.equal(exportedVarName('template_file'), 'your-template-file');
    assert.equal(exportedVarName('XMLParser'), 'your-xml-parser');
    assert.equal(exportedVarName('parseHTMLFile'), 'your-parse-html-file');
    assert.equal(exportedVarName('your_notes'), 'your-notes');
    // R2: an acronym is split off only before a real word, so a plural acronym stays whole.
    assert.equal(exportedVarName('storyIDs'), 'your-story-ids');
    assert.equal(exportedVarName('inputURLs'), 'your-input-urls');
    assert.equal(exportedVarName('PRDs'), 'your-prds');
    assert.equal(exportedVarName('2'), null);
    assert.equal(exportedVarName('_'), null);
  });

  it('{else} and {endif} are template syntax like {if …} and {/if}, and are left as written in any case', () => {
    const warnings = [];
    const src = '{if count > 0}✓ loaded{else}(none found){/if} {if x}a{ELSE}b{endif} {Endif}';
    assert.equal(applyTransformations(src, warnings), src);
    assert.equal(warnings.length, 0, JSON.stringify(warnings));
  });

  it('a clash is caught across sections when they share one record of names', () => {
    const warnings = [];
    const nameOwners = new Map();
    applyTransformations('Read {yourFile}', warnings, { nameOwners });
    applyTransformations('then {file}', warnings, { nameOwners });
    const w = warnings.find((x) => x.message.startsWith('unmapped config var {file}'));
    assert.ok(w, JSON.stringify(warnings));
    assert.match(w.message, /the same name as \{yourFile\}$/);
  });

  it('an unmapped variable that lands on a mapped name says so', () => {
    const warnings = [];
    const out = applyTransformations('Hello {user_name}, open {name}', warnings);
    assert.equal(out, 'Hello your-name, open your-name');
    const w = warnings.find((x) => x.message.startsWith('unmapped config var {name}'));
    assert.ok(w, JSON.stringify(warnings));
    assert.match(w.message, /exported as your-name, the same name as \{user_name\}$/);
  });

  it('two unmapped variables that land on one name say so', () => {
    const warnings = [];
    const out = applyTransformations('Read {yourFile} then {file}', warnings);
    assert.equal(out, 'Read your-file then your-file');
    const w = warnings.find((x) => x.message.startsWith('unmapped config var {file}'));
    assert.ok(w, JSON.stringify(warnings));
    assert.match(w.message, /exported as your-file, the same name as \{yourFile\}$/);
  });

  it('kebab-equivalent spellings of one variable are not reported as a clash', () => {
    const warnings = [];
    applyTransformations('{projectType} and {project_type}', warnings);
    assert.ok(!warnings.some((x) => /the same name as/.test(x.message)), JSON.stringify(warnings));
  });

  function tree(spec) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 't259-r1-'));
    for (const rel of spec) {
      const full = path.join(root, rel);
      if (rel.endsWith('/')) fs.mkdirSync(full, { recursive: true });
      else { fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, 'x'); }
    }
    return root;
  }

  it('a folder at any depth holding an inlined template is opened, not listed whole', () => {
    const root = tree(['SKILL.md', 'data/templates/prd.md', 'data/templates/other.md', 'data/notes.md', 'data/deep/a/b.md']);
    try {
      const got = listNotExported(root, [path.join(root, 'data/templates/prd.md')]);
      assert.deepEqual(got, ['data/deep/', 'data/notes.md', 'data/templates/other.md']);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('only the skill\'s own top-level SKILL.md and steps folders count as inlined, not same-named ones deeper down', () => {
    const root = tree(['SKILL.md', 'data/t.md', 'data/SKILL.md', 'data/steps/s.md', 'data/steps/x.md']);
    try {
      const got = listNotExported(root, [path.join(root, 'data/t.md'), path.join(root, 'data/steps/x.md')]);
      assert.deepEqual(got, ['data/SKILL.md', 'data/steps/s.md']);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('skips inlined and framework files, backups and dotfiles, but lists what steps folders carry besides .md', () => {
    const root = tree([
      'SKILL.md', 'workflow.md', 'bmad-skill-manifest.yaml', '.DS_Store', 'old.md.bak', 'old.bak/x.md',
      'steps/step-01.md', 'steps/step-01.md.bak', 'steps/helper.csv', 'steps-c/step-01.md', 'steps-c/sub/x.md',
      'kept.md',
    ]);
    try {
      assert.deepEqual(listNotExported(root, []), ['kept.md', 'steps-c/sub/', 'steps/helper.csv']);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('an export catches a clash between two of its sections', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 't259-r2-'));
    try {
      fs.cpSync(FIXTURE_ROOT, root, { recursive: true });
      const step = path.join(root, '_bmad/core/skills/bmad-brainstorming/steps/step-01-session-setup.md');
      let src = fs.readFileSync(step, 'utf8');
      // `## YOUR TASK` feeds "How to proceed"; a `## SUCCESS METRICS` bullet feeds "Quality checks".
      // {yourFile} is in both sections; {file} only in the second, so the clash is between sections.
      src = src.replace('## YOUR TASK:\n', '## YOUR TASK:\n\nRead {yourFile} first.\n');
      src = src.replace('## SUCCESS METRICS:\n', '## SUCCESS METRICS:\n\n- Wrote {file} from {yourFile} to disk.\n');
      fs.writeFileSync(step, src);
      const result = exportSkill('bmad-brainstorming', root);
      assert.ok(result.sections.howToProceed.includes('your-file') && result.sections.qualityChecks.includes('your-file'),
        'the two variables must land in different sections for this test to mean anything');
      assert.equal(result.warnings.filter((x) => x.message.startsWith('unmapped config var {yourFile}')).length, 1,
        'one warning per variable per export, though it appears in two sections (R3)');
      const w = result.warnings.find((x) => x.message.startsWith('unmapped config var {file}'));
      assert.ok(w, JSON.stringify(result.warnings.map((x) => x.message)));
      assert.match(w.message, /the same name as \{yourFile\}$/);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('a symlinked steps- folder is listed, because the loader does not read it', () => {
    const root = tree(['SKILL.md', 'real-steps/step-01.md']);
    try {
      fs.symlinkSync(path.join(root, 'real-steps'), path.join(root, 'steps-x'), 'dir');
      assert.deepEqual(listNotExported(root, []), ['real-steps/', 'steps-x/']);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('inlined paths match through a symlinked skill folder', () => {
    const real = tree(['SKILL.md', 'data/templates/t.md', 'data/other.md']);
    const alias = real + '-alias';
    try {
      fs.symlinkSync(real, alias, 'dir');
      assert.deepEqual(listNotExported(alias, [path.join(real, 'data/templates/t.md')]), ['data/other.md']);
      assert.deepEqual(listNotExported(real, [path.join(alias, 'data/templates/t.md')]), ['data/other.md']);
    } finally { fs.rmSync(alias, { force: true }); fs.rmSync(real, { recursive: true, force: true }); }
  });

  // R3 review: each case below was broken by a previous round's fix. Pinned so none comes back.
  it('R3: a symlink back up the tree is listed once, not walked forever', () => {
    const root = tree(['SKILL.md', 'data/templates/t.md', 'data/notes.md']);
    try {
      fs.symlinkSync(path.join(root, 'data'), path.join(root, 'data/loop'), 'dir');
      fs.symlinkSync(root, path.join(root, 'data/up'), 'dir');
      assert.deepEqual(listNotExported(root, [path.join(root, 'data/templates/t.md')]), ['data/loop/', 'data/notes.md', 'data/up/']);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('R3: an inlined template that is a symlink to a file elsewhere still counts as inlined', () => {
    const root = tree(['skill/SKILL.md', 'ext/tpl.md']);
    try {
      fs.mkdirSync(path.join(root, 'skill/data'));
      fs.symlinkSync(path.join(root, 'ext/tpl.md'), path.join(root, 'skill/data/tpl.md'), 'file');
      assert.deepEqual(listNotExported(path.join(root, 'skill'), [path.join(root, 'skill/data/tpl.md')]), []);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('R3: a relative inlined path is read from the working directory, as callers pass it', () => {
    const root = tree(['skill/SKILL.md', 'skill/data/tpl.md', 'skill/data/other.md']);
    const cwd = process.cwd();
    try {
      process.chdir(root);
      assert.deepEqual(listNotExported('skill', ['skill/data/tpl.md']), ['data/other.md']);
    } finally { process.chdir(cwd); fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('R3: each acronym case the reviews raised splits as a reader would', () => {
    const cases = {
      XMLParser: 'your-xml-parser', parseHTMLFile: 'your-parse-html-file', HTTPServer: 'your-http-server',
      HTTPSServer: 'your-https-server', APIKey: 'your-api-key', IOError: 'your-io-error',
      storyIDs: 'your-story-ids', inputURLs: 'your-input-urls', PRDs: 'your-prds', IDsList: 'your-ids-list',
      getURLsFor: 'your-get-urls-for', URLsTo: 'your-urls-to', userIDsByName: 'your-user-ids-by-name',
      getIDOf: 'your-get-id-of', mapIDToName: 'your-map-id-to-name', HTMLId: 'your-html-id', URLTo: 'your-url-to',
      XMLIn: 'your-xml-in', APIUsage: 'your-api-usage',
      // Known limit: an acronym then a final `Is` or `As` reads as a plural acronym (`IDIs`, `XMLAs`).
      userIDIs: 'your-user-idis', loadXMLAs: 'your-load-xmlas',
    };
    const got = Object.fromEntries(Object.keys(cases).map((k) => [k, exportedVarName(k)]));
    assert.deepEqual(got, cases);
  });

  it('R3: one variable is warned about once per export, not once per section', () => {
    const warnings = [];
    const state = { nameOwners: new Map(), unmappedSeen: new Set() };
    applyTransformations('Read {foo}', warnings, state);
    applyTransformations('then {foo} again', warnings, state);
    assert.equal(warnings.filter((x) => x.message.startsWith('unmapped config var {foo}')).length, 1, JSON.stringify(warnings));
  });

  it('a symlinked folder is listed as a folder', () => {
    const root = tree(['SKILL.md', 'real/a.md']);
    try {
      fs.symlinkSync(path.join(root, 'real'), path.join(root, 'linked'), 'dir');
      assert.deepEqual(listNotExported(root, []), ['linked/', 'real/']);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
});
