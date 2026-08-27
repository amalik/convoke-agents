'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { FIXTURE_ROOT } = require('./portability-fixture');
const { exportSkill, ALLOWED_WARNING_TYPES } = require('../../scripts/portability/export-engine');

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

  // 7. warnings.length <= 2
  if (result.warnings.length > 2) {
    console.error(`${expectedName} produced ${result.warnings.length} warnings:`, result.warnings);
  }
  assert.ok(result.warnings.length <= 2);

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

  it('Test 4: bmad-dev-story (Tier 3 pipeline) exports with framework-only notice', () => {
    const result = exportSkill('bmad-dev-story', projectRoot);
    assert.notStrictEqual(result, undefined);
    assert.ok(result.instructions.includes('Framework-only skill'));
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

  it('Test 7: Carson produces warnings.length <= 2 with allowed types only', () => {
    const result = exportSkill('bmad-brainstorming', projectRoot);
    assert.ok(result.warnings.length <= 2);
    for (const warning of result.warnings) {
      assert.equal(ALLOWED_WARNING_TYPES.has(warning.type), true);
    }
  });

  it('Test 8: Winston produces warnings.length <= 2 with allowed types only', () => {
    const result = exportSkill('bmad-agent-architect', projectRoot);
    assert.ok(result.warnings.length <= 2);
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
      /unmapped config var stripped via catch-all: \{your-/.test(w.message || '')
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
