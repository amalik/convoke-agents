'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { guardedModuleNames } = require('../../scripts/update/lib/refresh-installation');
const { MODULE_PROFILES } = require('../../scripts/update/lib/config-merger');

const ROOT = path.join(__dirname, '..', '..');
const HEADING = '### Which configs are checked, and which are preserved';
const ANCHOR = 'which-configs-are-checked-and-which-are-preserved';

// ─────────────────────────────────────────────────────────────────
// T233. `UPDATE-GUIDE.md` and `INSTALLATION.md` stated which module configs are checked and
// which keep operator values in about a dozen scattered places, and successive sentence-level
// corrections contradicted each other: every fix reached one passage and broke another the
// author had not read. The instrument is one canonical section that every other mention
// points to.
//
// WHAT THIS ASSERTS:
//   1. The canonical section exists under its exact heading.
//   2. The module set in its table is the set the code actually guards, and no row in that
//      table escapes the check by being shaped differently.
//   3. Its "your values are kept" rows are exactly the modules `mergeConfig` has a profile
//      for. That claim was false in BOTH directions in the shipped guides.
//   4. Every unreadable-column cell says the run refuses.
//   5. Every anchor either guide uses resolves to a real heading in the target file, and no
//      heading anchor is ambiguous.
//   6. Each section that used to restate the facts still carries a pointer — enumerated per
//      section, because a whole-file substring check passed with all but one deleted.
//
// WHAT THIS DOES NOT ASSERT. It cannot tell that a NEW contradictory sentence has been added
// elsewhere in either guide — the failure mode T233 exists to stop. It also does not pin the
// prose below the table (the kept-is-a-rule paragraph, the `Repaired` string, the re-seeding
// rule, the backup sentences); those are reviewed, not tested. This file is a floor.
// ─────────────────────────────────────────────────────────────────

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

/**
 * Remove fenced code regions. Without this, a `#` shell comment inside a fence is read as a
 * heading: 12 phantom anchors in UPDATE-GUIDE.md and 8 in INSTALLATION.md. That cut both ways —
 * a link to a phantom was reported as RESOLVING (it 404s on GitHub), and a fence comment
 * colliding with a real heading reddened the ambiguity check for nothing.
 */
function stripFences(body) {
  return body.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
}

/**
 * GitHub's heading-anchor rule. Letters, numbers, `_` and `-` survive; everything else is
 * dropped and spaces become hyphens. `_` must be KEPT — stripping it computed the wrong anchor
 * for any heading naming a module, and rejected the link GitHub actually resolves.
 */
function anchorOf(headingText) {
  return headingText.toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replace(/ /g, '-');
}

function headingAnchors(body) {
  const seen = new Map();
  for (const [, text] of stripFences(body).matchAll(/^#{1,6} (.+)$/gm)) {
    const a = anchorOf(text.trim());
    seen.set(a, (seen.get(a) || 0) + 1);
  }
  return seen;
}

/** A named section's body: its heading to the next heading of equal or higher level. */
function sectionOf(body, heading) {
  const stripped = stripFences(body);
  const i = stripped.indexOf(`\n${heading}\n`);
  assert.notEqual(i, -1, `"${heading}" is missing`);
  const rest = stripped.slice(i + heading.length + 2);
  const depth = heading.match(/^#+/)[0].length;
  const end = rest.search(new RegExp(`\\n#{1,${depth}} `));
  return end === -1 ? rest : rest.slice(0, end);
}

const ROW = /^\|\s*`(_[a-z-]+)`\s*\|([^|]*)\|([^|]*)\|\s*$/;

/**
 * The canonical table's module rows. Every `|`-leading line in the section must be the header,
 * the separator, or a conforming row — a regex that merely SKIPS a non-conforming line let a
 * sixth row be added (un-backticked, or with a fourth column) claiming a module's config is
 * checked when it is not, with the suite green.
 */
function tableRows(section) {
  const rows = [];
  for (const line of section.split('\n')) {
    if (!line.trimStart().startsWith('|')) continue;
    if (/^\|\s*Module config\s*\|/.test(line) || /^\|[\s|:-]+\|$/.test(line)) continue;
    const m = ROW.exec(line);
    assert.ok(m, `unparsed table row in the canonical section, so no check sees it: ${line}`);
    rows.push({ module: m[1], unreadable: m[2].trim(), readable: m[3].trim() });
  }
  return rows;
}

describe('T233 — the canonical config section is bound to the code it describes', () => {
  // Parsed inside each `it`, not in the describe body: a throw out here aborts suite
  // construction, which still fails the run but silently drops the other tests from it.
  const canonical = () => tableRows(sectionOf(read('UPDATE-GUIDE.md'), HEADING));

  it('lists exactly the modules whose config the installer guards', () => {
    const rows = canonical();
    assert.ok(rows.length > 0, 'the canonical table has no module rows — the parse or the table changed');
    assert.deepEqual(
      rows.map((r) => r.module).sort(),
      [...guardedModuleNames()].sort(),
      'the table and GUARDED_MODULE_NAMES disagree; the guide would be telling operators that a ' +
        'config is checked when it is not, or omitting one that is'
    );
  });

  it('says every guarded config is refused when it cannot be read', () => {
    const rows = canonical();
    assert.ok(rows.length > 0, 'no rows to check — this assertion would pass vacuously');
    for (const r of rows) {
      assert.match(r.unreadable, /Refused/,
        `${r.module}: the guard calls assertConfigReadable on it, so the guide must say it refuses`);
    }
  });

  it('marks as kept exactly the modules mergeConfig carries a profile for', () => {
    const rows = canonical();
    const kept = rows.filter((r) => /kept/i.test(r.readable)).map((r) => r.module).sort();
    const replaced = rows.filter((r) => /Replaced/i.test(r.readable)).map((r) => r.module).sort();

    assert.deepEqual(kept, Object.keys(MODULE_PROFILES).sort(),
      'a module is shown as keeping operator values without a mergeConfig profile, or vice versa');
    assert.equal(kept.length + replaced.length, rows.length,
      'a row was neither classified as kept nor as Replaced, which is how the ambiguity returns');
    assert.deepEqual([...kept, ...replaced].sort(), [...guardedModuleNames()].sort());
  });

  it('the heading yields the anchor every pointer uses', () => {
    assert.equal(anchorOf(HEADING.replace(/^#+ /, '')), ANCHOR);
  });
});

// Each section that restated the facts before T233 must still carry a pointer. Enumerated per
// section: a whole-file `includes()` stayed green with all but one pointer deleted, because the
// survivor answered for the rest.
const POINTER_SITES = {
  'UPDATE-GUIDE.md': [
    "### What's Never Touched",
    '### What Gets Updated',
    '### What Is Managed by the Update System',
    '### "refusing to overwrite ... config.yaml"',
    '### "Installation appears corrupted"',
  ],
  'INSTALLATION.md': ['## Configuration', '### Config file already exists'],
};

describe('T233 — every section that used to restate the facts points at them instead', () => {
  for (const [file, sites] of Object.entries(POINTER_SITES)) {
    const target = file === 'UPDATE-GUIDE.md' ? `](#${ANCHOR})` : `](UPDATE-GUIDE.md#${ANCHOR})`;
    for (const site of sites) {
      it(`${file} "${site.replace(/^#+ /, '')}"`, () => {
        assert.ok(sectionOf(read(file), site).includes(target),
          'this section restated what is checked and preserved; a reader who lands here gets ' +
            'nothing unless it points at the canonical section');
      });
    }
  }
});

describe('T233 — every anchor the two guides use resolves', () => {
  const FILES = ['UPDATE-GUIDE.md', 'INSTALLATION.md'];
  // Floors stated as the measured counts, so a scan that stops finding links fails instead of
  // passing. A floor of zero asserts nothing, and guarded a collection that is empty here.
  const FLOOR = { 'UPDATE-GUIDE.md': 12, 'INSTALLATION.md': 3 };

  const links = (body) => [
    ...[...body.matchAll(/\]\((#[^)\s]+)\)/g)].map((m) => ({ target: null, anchor: m[1].slice(1) })),
    ...[...body.matchAll(/\]\((UPDATE-GUIDE\.md|INSTALLATION\.md)(#[^)\s]+)\)/g)]
      .map((m) => ({ target: m[1], anchor: m[2].slice(1) })),
  ];

  it('the link scan still finds what is there', () => {
    for (const f of FILES) {
      const n = links(read(f)).length;
      assert.ok(n >= FLOOR[f], `${f}: found ${n} anchor links, expected at least ${FLOOR[f]} — the scan broke`);
    }
  });

  it('each one points at a real heading', () => {
    const anchors = Object.fromEntries(FILES.map((f) => [f, headingAnchors(read(f))]));
    for (const f of FILES) {
      for (const { target, anchor } of links(read(f))) {
        const where = target || f;
        assert.ok(anchors[where].has(anchor), `${f}: ${target || ''}#${anchor} matches no heading in ${where}`);
      }
    }
  });

  it('no duplicate heading silently repoints an anchor', () => {
    for (const f of FILES) {
      for (const [anchor, n] of headingAnchors(read(f))) {
        assert.equal(n, 1, `${f}: heading anchor #${anchor} occurs ${n} times, so links to it are ambiguous`);
      }
    }
  });
});
