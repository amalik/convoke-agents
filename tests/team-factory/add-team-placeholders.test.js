'use strict';

/**
 * Every path placeholder an add-team step file names is defined in that same file, and resolves
 * absolutely.
 *
 * WHY THIS EXISTS (T168). `{spec_path}` was defined in `step-04-generate.md` and used in
 * `step-02-connect.md` and `step-05-validate.md`, neither of which defined it — and the path
 * placeholders were documented repo-relative while their siblings were `{project-root}`-absolute. A
 * relative path resolves against whatever directory the executor is in, so a block run from anywhere
 * but the repo root throws ENOENT, and `initContext` run from two directories silently creates two
 * different context files. That is how `checkConfig`/`checkActivation`/`checkRegistryWiring` once
 * reported false failures on a correctly generated team.
 *
 * THE LIST BELOW IS LITERAL, ON PURPOSE. The first version of this file derived it from the step
 * files' own definitions — so deleting a definition removed the placeholder from the set, and the
 * test went green on exactly the state T168 describes: 9 `run:` blocks passing `{context_path}` with
 * no file defining it. A set built from the thing under test is blind to deletion. `UNLISTED_SHAPE`
 * is the other half: a new `{…_path}` or `{…_root}` fails until it is added here deliberately.
 *
 * `committed-artifact-integrity` (`project-context.md`): the step files ARE the subject, and a
 * fixture copy would test the copy. Expectations come from this file's own list, not from the
 * artifacts. Assertions about `run-context.js`'s BEHAVIOUR live in `run-context.test.js` against
 * temp-dir fixtures, because asserting on code would forfeit the exception's first condition.
 *
 * WHAT THIS DOES NOT CATCH: a placeholder defined with a wrong-but-absolute path; a plural
 * `{…_paths}` name; the values an executor RECORDS into the context file (step-04's context-key
 * table states the requirement, nothing enforces it — T212); and narration placeholders such as
 * `{agent_id}`, which are prose slots rather than command arguments.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');

const STEPS_DIR = path.join(PACKAGE_ROOT, '_bmad/bme/_team-factory/workflows/add-team');
const STEP_FILES = fs.readdirSync(STEPS_DIR).filter((f) => /\.md$/.test(f)).sort();

// Every placeholder that resolves to a path on disk. Adding one here without defining it in the
// step files that name it fails; naming a new one in a step file without adding it here also fails.
const PATH_PLACEHOLDERS = ['config_path', 'context_path', 'module_root', 'registry_path', 'scope_path', 'spec_path'];
const UNLISTED_SHAPE = /^[a-z][a-z0-9_]*_(path|root)$/;

// A table row: | `{name}` | definition |
const DEFINITION = /^\|\s*`\{([a-z][a-z0-9_-]*)\}`\s*\|(.*)$/gm;

function definitions(text) {
  const out = new Map();
  for (const m of text.matchAll(DEFINITION)) out.set(m[1], m[2]);
  return out;
}

// Anywhere in the file, not only on `run:` lines: a command can wrap onto a continuation line, can
// sit in an `expect:` block, and a path shown to an operator in a summary is one they will type.
function mentioned(text) {
  return new Set([...text.matchAll(/\{([a-z][a-z0-9_-]*)\}/g)].map((m) => m[1]));
}

describe('add-team step files — path placeholders', () => {
  it('the step files and the list are both non-empty', () => {
    assert.ok(STEP_FILES.length >= 5, `expected the add-team step files, found ${STEP_FILES.length}`);
    assert.ok(PATH_PLACEHOLDERS.length >= 6, 'the literal list has shrunk — it is the standard, not a snapshot');
  });

  it('every {…_path} / {…_root} name used anywhere is on the list', () => {
    const unlisted = new Set();
    for (const file of STEP_FILES) {
      for (const name of mentioned(fs.readFileSync(path.join(STEPS_DIR, file), 'utf8'))) {
        if (UNLISTED_SHAPE.test(name) && !PATH_PLACEHOLDERS.includes(name)) unlisted.add(`${name} (${file})`);
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

    it(`${file}: every path placeholder it defines is {project-root}-absolute`, () => {
      const relative = PATH_PLACEHOLDERS
        .filter((n) => defined.has(n) && !defined.get(n).includes('{project-root}/'))
        .sort();
      assert.deepEqual(relative, [],
        `${file} documents ${relative.join(', ')} without a {project-root}/ prefix. It resolves against the `
        + "executor's working directory, so the same block run from two directories reads or writes two different files.");
    });
  }
});
