'use strict';

/**
 * The Covenant ships, and keeps shipping (story dist-2.3b).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `_bmad/bme/covenant/` is listed in `files[]` as TWO NAMED FILE ENTRIES, not as a directory.
 * That is deliberate: `scripts/audit/lib/installed-tree.js` reads every `_bmad/bme/<name>/` entry
 * as a MODULE, so a directory entry would make `covenant` a module and then demand it arrive in
 * the project, carry a `config.yaml` and declare units — three findings, for a documentation
 * directory that is none of those things. The named-file form follows the existing
 * `_bmad/_config/skill-manifest.csv` precedent.
 *
 * The cost of that choice is a coupling: a THIRD covenant document added later would silently not
 * ship. This file is what makes that loud instead of silent — it is the whole reason the named-file
 * form is safe to prefer.
 *
 * The Covenant is normative required reading (`project-context.md`), cited by every `_bmad/bme/`
 * skill. Before this story it lived in `_bmad-output/`, which does not ship at all.
 *
 * WHAT THESE TESTS DO NOT PROVE. They assert the documents reach the PACKAGE. They do not reach an
 * installed project — no install path copies `_bmad/bme/covenant/`, the same gap
 * `_bmad/bme/_portability/` has, which is `dist-2-6`'s scope and is on the backlog. Said here
 * because this file is what a future reader will trust, and a test file that implies the problem
 * is fully solved is worse than one that names what is left.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');

const DIR = '_bmad/bme/covenant';
const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));

/**
 * Every relative-link form, declared ONCE. Two copies meant the positive control exercised its own
 * untouched literal, so weakening the real check would have left the control green — the shape of
 * defect this file exists to catch.
 */
const RELATIVE_LINK = /\]\(\s*<?([^)>\s]+)>?[^)]*\)|^\[[^\]]+\]:\s*(\S+)/gm;

/** Targets in `body` that leave the packaged covenant directory. */
function escapingLinks(body) {
  const out = [];
  for (const m of body.matchAll(RELATIVE_LINK)) {
    const target = (m[1] || m[2] || '').split('#')[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
    const base = path.join(PACKAGE_ROOT, DIR);
    if (path.relative(base, path.resolve(base, target)).startsWith('..')) out.push(target);
  }
  return out;
}

describe('dist-2.3b: the Covenant ships', () => {
  it('every file in the covenant directory is listed in files[]', () => {
    // THE COUPLING GUARD. Named entries mean a new file is not covered by a parent glob, so
    // adding one without adding it here would ship an operator a Covenant with a missing half.
    const onDisk = fs.readdirSync(path.join(PACKAGE_ROOT, DIR)).filter(f => !f.startsWith('.')).sort();
    assert.ok(onDisk.length > 0, `${DIR} is empty — the Covenant must not be deleted`);
    const missing = onDisk.filter(f => !pkg.files.includes(`${DIR}/${f}`));
    assert.deepEqual(missing, [], `present in ${DIR} but absent from files[]: ${missing.join(', ')}`);
  });

  it('does not list the directory itself, which would be read as a bme MODULE', () => {
    // If this ever flips, `shippedBmeModules` gains a `covenant` module and the installed-tree
    // gate starts demanding a config.yaml and declared units for a folder of prose.
    const asDir = pkg.files.filter(f => /^_bmad\/bme\/covenant\/?$/.test(f));
    assert.deepEqual(asDir, [], 'covenant must be listed as named files, not as a directory');
  });

  it('the packed TARBALL actually carries both documents — asked of npm, not of files[]', () => {
    // Every other assertion here reads configuration. This one reads what npm would publish.
    // `files[]` is a proxy: this repository already subtracts from it with `.npmignore` (two of
    // them), so a future ignore rule could drop the Covenant with the array still correct.
    const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: PACKAGE_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    const packed = JSON.parse(out)[0].files.map(f => f.path);
    assert.ok(packed.length > 100, `sanity: expected a full listing, got ${packed.length}`);
    for (const f of ['covenant-operator.md', 'compliance-checklist.md']) {
      assert.ok(packed.includes(`${DIR}/${f}`), `${DIR}/${f} is not in the tarball`);
    }
  });

  it('the two normative documents are present and non-trivial', () => {
    for (const f of ['covenant-operator.md', 'compliance-checklist.md']) {
      const body = fs.readFileSync(path.join(PACKAGE_ROOT, DIR, f), 'utf8');
      assert.ok(body.length > 1000, `${f} looks truncated (${body.length} bytes)`);
    }
  });

  it('the escape check can actually fail', () => {
    // Positive control. Both documents contain only anchors and absolute URLs, so the assertion
    // below is currently unreachable — it would pass against an implementation that checks
    // nothing. This drives the same regex with an input that MUST be caught, in each of the four
    // forms a reader might write.
    for (const sample of ['[x](../escaped.md)', '[x](./../escaped.md)', '[x](<../escaped.md>)', '[ref]: ../escaped.md']) {
      assert.ok(escapingLinks(sample).length > 0, `the escape check missed: ${sample}`);
    }
  });

  it('carries no link that would break once packaged', () => {
    // The Covenant moved INTO the package, so its own outbound links must resolve inside it.
    // The Checklist had two into `_bmad-output/implementation-artifacts/`, which does not ship;
    // they are now self-referential absolute URLs, validated by dist-2.2's AC5 clause against the
    // repository. A future relative link out of this directory would reintroduce the defect.
    // Matches every relative form, not just `](../`. The first version matched only that one
    // and would have missed `](./../x)`, `](<../x>)`, a root-anchored `](/x)`, and a
    // reference-style definition `[x]: ../y` — each of which escapes just as effectively.
    for (const f of fs.readdirSync(path.join(PACKAGE_ROOT, DIR)).filter(f => f.endsWith('.md'))) {
      const escaping = escapingLinks(fs.readFileSync(path.join(PACKAGE_ROOT, DIR, f), 'utf8'));
      assert.deepEqual(escaping, [], `${f} links out of the packaged directory: ${escaping.join(', ')}`);
    }
  });
});
