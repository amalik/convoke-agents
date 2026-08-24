'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { initGitFixture, removeTempDirSync } = require('../helpers');

const {
  menuCodes,
  scanTemplate,
  wrapperTemplates,
} = require('../../scripts/audit/agent-surface-parity.js');

// Regression tests for the deterministic gate that REPLACED the retired M9 PF1 battery
// (ADR-001, 2026-08-13). The script shipped and went live in CI with no tests of its own;
// these were added 2026-08-14 after Round 3 review demonstrated a silent-truncation defect
// in the wrapper extractor.
//
// WHY THE WRAPPER MATTERS
// -----------------------
// An agent executes TWO files: the tracked `_bmad/bme/**/agents/<id>.md`, and the GENERATED,
// GITIGNORED `.claude/skills/<id>/SKILL.md` that wraps it. A real, migration-caused instruction
// change lived in the wrapper for 10 weeks, invisible to every diff of `agents/**` that was run,
// and silently contaminated PF1's control agent. The wrapper's generator IS tracked, so the gate
// recovers the surface by extracting the generator's template literals — which makes the
// extractor itself safety-critical: a WRONG-but-nonzero extraction reports parity it never
// checked.

const created = [];
afterEach(() => {
  while (created.length) removeTempDirSync(created.pop());
});

describe('scanTemplate — finds the end of a template literal', () => {
  // Each case is `[input, expected slice]`; `null` means "unterminated, report failure".
  // The literal starts at index 0 (i.e. just after its opening backtick).
  const cases = [
    ['no interpolation', 'HELLO`AFTER', 'HELLO'],
    ['simple interpolation', 'A ${x} B`AFTER', 'A ${x} B'],
    ['nested template literal inside ${}', 'A ${ `in` } TAIL`AFTER', 'A ${ `in` } TAIL'],
    ['backtick inside a quoted string', 'A ${ f("`") } TAIL`AFTER', 'A ${ f("`") } TAIL'],
    ['escaped backtick', 'A \\` B`AFTER', 'A \\` B'],
    ['unterminated literal', 'A ${ ({}) ', null],
  ];

  for (const [name, src, want] of cases) {
    it(name, () => {
      const end = scanTemplate(src, 0);
      assert.equal(end === -1 ? null : src.slice(0, end), want);
    });
  }

  it('does not desync on a brace inside an interpolation (the R3 defect)', () => {
    // THE BUG: a single `depth` counter incremented on `${` but decremented on ANY bare `}`.
    // An object literal's `}` zeroed it early, so the NEXT backtick — opening a nested template
    // literal, ordinary in generator code — was misread as the closing one. Everything after it
    // was silently discarded. A change in that discarded tail then produced NO finding: the gate
    // passed green while the executed wrapper had changed.
    const src = 'A ${ ({}) + `i` } THE-TAIL-THAT-WAS-BEING-DROPPED`AFTER';
    const end = scanTemplate(src, 0);
    assert.notEqual(end, -1, 'literal was reported unterminated');
    assert.equal(src.slice(0, end), 'A ${ ({}) + `i` } THE-TAIL-THAT-WAS-BEING-DROPPED');
  });
});

describe('wrapperTemplates — extracts the generated agent wrapper from its generator', () => {
  /** A throwaway repo whose generator contains one wrapper template with `tail` at the end. */
  function repoWithGenerator(tail) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asp-'));
    created.push(dir);
    const git = (args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
    initGitFixture(dir);
    fs.mkdirSync(path.join(dir, 'scripts/update/lib'), { recursive: true });
    // Deliberately uses the brace-plus-nested-backtick construct that broke the old scanner.
    const gen =
      'const content = `HEADER\n' +
      'LOAD ${ ({}) + `x` } ' +
      tail +
      '\nEND`;\n';
    fs.writeFileSync(path.join(dir, 'scripts/update/lib/refresh-installation.js'), gen);
    git(['add', '-A']);
    git(['commit', '-qm', 'gen']);
    return dir;
  }

  it('detects a change in the wrapper text', () => {
    // The whole point of the gate. Before the fix both versions extracted to the same truncated
    // prefix and this assertion failed — i.e. real wrapper drift was undetectable.
    const before = wrapperTemplates(repoWithGenerator('TAIL-ONE'), 'HEAD');
    const after = wrapperTemplates(repoWithGenerator('TAIL-TWO-COMPLETELY-DIFFERENT'), 'HEAD');
    assert.ok(before.length > 0 && after.length > 0, 'extraction produced nothing');
    assert.notDeepEqual(before, after, 'wrapper drift was invisible — the gate would pass green');
    assert.match(before[0], /TAIL-ONE/, 'the differing tail was truncated away');
  });

  it('returns [] when the generator is absent, so the caller can fail closed', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asp-empty-'));
    created.push(dir);
    const git = (args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
    initGitFixture(dir);
    fs.writeFileSync(path.join(dir, 'README.md'), 'x\n');
    git(['add', '-A']);
    git(['commit', '-qm', 'init']);
    assert.deepEqual(wrapperTemplates(dir, 'HEAD'), []);
  });

  it("extracts THIS repo's real generator, and it matches the committed baseline", () => {
    // Guards the extractor against the generator being refactored out from under it. If this
    // fails, `.github/expected-wrapper-template.txt` and the extractor have drifted apart and
    // the CI gate is comparing something other than what it claims.
    //
    // DELIBERATE `test-fixture-isolation` EXCEPTION. This asserts against the live repo, which
    // that rule forbids — but drift between the extractor and the committed baseline is the only
    // thing it can be checked against, and the rule's own exception clause points such a check at
    // a separate gate. It reads the tree at HEAD via git rather than the working tree, so it is
    // unaffected by uncommitted work (verified: dirtying refresh-installation.js leaves it green).
    // If it ever fails, the extractor and `.github/expected-wrapper-template.txt` have diverged —
    // that is a real finding, not flake. Do not "fix" it by loosening the assertion.
    const repoRoot = path.resolve(__dirname, '../..');
    const templates = wrapperTemplates(repoRoot, 'HEAD');
    assert.ok(templates.length > 0, 'extractor no longer matches refresh-installation.js');
    const baseline = fs.readFileSync(
      path.join(repoRoot, '.github/expected-wrapper-template.txt'),
      'utf8'
    );
    assert.equal(templates.join('\n~~~\n').trimEnd(), baseline.trimEnd());
  });
});

describe('menuCodes — format-agnostic by construction', () => {
  it('reads both XML menu items and markdown table rows', () => {
    // A format-specific extractor manufactures false findings: during development a table-only
    // matcher reported an agent's menu as empty when it was simply still in XML form.
    assert.deepEqual(menuCodes('<item cmd="AB ...">[AB] Label</item>'), ['AB']);
    assert.deepEqual(menuCodes('| CD | something |'), ['CD']);
    assert.deepEqual(menuCodes('[AB] x\n| CD | y |'), ['AB', 'CD']);
  });
});
