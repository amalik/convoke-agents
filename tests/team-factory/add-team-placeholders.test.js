'use strict';

/**
 * Every path placeholder an add-team step file names is defined in that same file, and resolves
 * absolutely.
 *
 * WHY THIS EXISTS (T168). `{spec_path}` was defined in `step-04-generate.md` and used in
 * `step-02-connect.md` and `step-05-validate.md`, neither of which defined it, and the path
 * placeholders were documented repo-relative. A relative path resolves against whatever directory
 * the executor is in, so a `run:` block executed from anywhere but the repo root throws ENOENT, and
 * `initContext` run from two directories creates two different context files.
 *
 * THE LIST OF PLACEHOLDERS AND THE LIST OF FILES ARE BOTH LITERAL, ON PURPOSE. Earlier versions
 * derived each from the thing it judges: the placeholder list from the step files' own definitions,
 * so deleting a definition removed it from the set; then the file list from a directory read, so
 * deleting `step-02-connect.md` — the file this work added a table to — left everything green. A set
 * built from the thing under test is blind to deletion, at every level.
 *
 * `committed-artifact-integrity` (`project-context.md`): the step files ARE the subject, and a
 * fixture copy would test the copy. Expectations come from this file's literal lists. Assertions
 * about `run-context.js`'s behaviour live in `run-context.test.js` against temp-dir fixtures,
 * because asserting on code would forfeit the exception's first condition.
 *
 * WHAT THIS DOES NOT CATCH: a placeholder defined with a wrong-but-absolute path; `{team}` and
 * `{path}`, which are path-valued but shaped like narration so `PATH_SHAPE` never sees them, and
 * `{output_directory}`, which it sees and `NOT_A_PATH` exempts — all three are defined nowhere in
 * the workflow (T213); the values an executor RECORDS into the context file (T212); and narration
 * slots such as `{agent_id}`, which are prose rather than command arguments.
 *
 * Deleting a step file does not reach the directory-contents assertion: the module-level read below
 * throws first, cancelling every test in this file. That is still a red, non-zero exit — the message
 * on that assertion fires for additions and renames.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');

const STEPS_DIR = path.join(PACKAGE_ROOT, '_bmad/bme/_team-factory/workflows/add-team');

// Literal, and checked against the directory below: a file list read from disk cannot notice that a
// file is gone, which is how deleting an entire step file once passed.
const STEP_FILES = [
  'step-01-scope.md',
  'step-02-connect.md',
  'step-03-review.md',
  'step-04-generate.md',
  'step-05-validate.md',
  'workflow.md',
];

// Every placeholder that resolves to a path on disk. Adding one here without defining it in the
// step files that name it fails; naming a new one in a step file without adding it here also fails.
const PATH_PLACEHOLDERS = ['config_path', 'context_path', 'module_root', 'registry_path', 'scope_path', 'spec_path'];

// Anything shaped like a path placeholder must be on that list or named here with its reason. The
// shape is deliberately wider than the six: `{…_directory}` and `{…_paths}` escaped an earlier
// `_(path|root)$`.
// Dashes as well as underscores: `{project-root}` is the framework's own central placeholder, so
// house style produces `{context-path}` as readily as `{context_path}`, and an underscore-only shape
// left the dashed spelling with no guard at all.
const PATH_SHAPE = /^[a-z][a-z0-9_-]*[_-](path|paths|root|dir|dirs|directory|file|files)$/;
const NOT_A_PATH = new Map([
  ['agent_file_paths', 'retired — its row in step-04 is struck through, and no run: block passes it'],
  ['output_directory', 'a spec VALUE, interpolated as `{project-root}/{output_directory}` by its consumers'],
  ['project-root', 'the substitution root itself — the prefix every other path is measured against'],
]);

// A table row: | `{name}` | definition |
const DEFINITION = /^\|\s*`\{([a-z][a-z0-9_-]*)\}`\s*\|(.*)$/gm;

// Fenced blocks and HTML comments are stripped first: an example of the table format inside a fence,
// or a commented-out table, once counted as defining everything in it — and `set` is first-wins, so a
// later example cannot satisfy the check for a broken row above it.
function definitions(text) {
  const body = text.replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const out = new Map();
  for (const m of body.matchAll(DEFINITION)) if (!out.has(m[1])) out.set(m[1], m[2]);
  return out;
}

// The value a placeholder resolves to is the first backticked token in its row that is a PATH: it
// contains a `/` and does not end in one. Three weaker readings each passed a relative definition —
// the whole cell containing `{project-root}/` anywhere ("…, relative to `{project-root}/`"), a cell
// naming a different absolute file, and the first backticked token of any kind ("Relative to
// `{project-root}/`: `_bmad-output/…`", where that token IS the bare prefix).
function resolvesTo(definition) {
  const tokens = [...String(definition).matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
  return tokens.find((t) => t.includes('/') && !t.endsWith('/')) || '';
}

// Anywhere in the file, not only on `run:` lines: a command can wrap onto a continuation line, can
// sit in an `expect:` block, and a path shown to an operator in a summary is one they will type.
function mentioned(text) {
  return new Set([...text.matchAll(/\{([a-z][a-z0-9_-]*)\}/g)].map((m) => m[1]));
}

describe('add-team step files — path placeholders', () => {
  it('the workflow directory holds exactly the files this test knows about', () => {
    const onDisk = fs.readdirSync(STEPS_DIR).filter((f) => /\.md$/i.test(f)).sort();
    assert.deepEqual(onDisk, [...STEP_FILES].sort(),
      'a step file was added or renamed. Update STEP_FILES deliberately — a file this test does not '
      + 'know about is a file it cannot check. (A DELETED file throws at load instead, which is also red.)');
    assert.ok(PATH_PLACEHOLDERS.length >= 6, 'the literal list has shrunk — it is the standard, not a snapshot');
  });

  it('every path-shaped name used anywhere is on the list, or named as not a path', () => {
    const unlisted = new Set();
    for (const file of STEP_FILES) {
      for (const name of mentioned(fs.readFileSync(path.join(STEPS_DIR, file), 'utf8'))) {
        if (PATH_SHAPE.test(name) && !PATH_PLACEHOLDERS.includes(name) && !NOT_A_PATH.has(name)) {
          unlisted.add(`${name} (${file})`);
        }
      }
    }
    assert.deepEqual([...unlisted], [],
      'a path-shaped placeholder is not on this file\'s list, so nothing checks that it is defined or absolute. '
      + 'Add it to PATH_PLACEHOLDERS and define it in every step file that names it.');
  });

  for (const file of STEP_FILES) {
    const text = fs.readFileSync(path.join(STEPS_DIR, file), 'utf8');
    const defined = definitions(text);
    const used = mentioned(text);

    it(`${file}: defines every path placeholder it names`, () => {
      const undefinedHere = PATH_PLACEHOLDERS.filter((n) => used.has(n) && !defined.has(n));
      assert.deepEqual(undefinedHere, [],
        `${file} names ${undefinedHere.join(', ')} but defines it nowhere in this file. `
        + 'Reading one step file must be enough to run it — a name defined only in a sibling is how these went cwd-relative.');
    });

    // `[VT] Validate Team` re-runs step 05 against an existing team and reads the context file
    // (`step-05-validate.md` says so, and `readContext` throws without it). Two tables document that
    // file's lifetime, and for one round they disagreed: step-05 was rewritten to "do not delete it,
    // step 04 governs", while step 04 still said "delete it after step-05 completes" — so the
    // instruction survived the fix that was supposed to remove it.
    it(`${file}: does not order the context file deleted`, () => {
      const cell = defined.get('context_path') || '';
      assert.equal(/(?<!do not )(?<!never )\bdelete (it|this file)\b/i.test(cell), false,
        `${file} tells the operator to delete the context file. [VT] Validate Team reads it, so the `
        + 'team it was generated for can never be re-validated. Say when it may be removed instead.');
    });

    it(`${file}: every path placeholder it defines is {project-root}-absolute`, () => {
      const relative = PATH_PLACEHOLDERS
        .filter((n) => defined.has(n) && !resolvesTo(defined.get(n)).startsWith('{project-root}/'))
        .sort();
      assert.deepEqual(relative, [],
        `${file} documents ${relative.join(', ')} with a value that does not START \`{project-root}/\`. It then `
        + "resolves against the executor's working directory, so the same block run from two directories reads or "
        + 'writes two different files. (The value read is the first backticked token in the row — keep it on the row\'s first line.)');
    });
  }
});
