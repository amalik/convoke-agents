'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { guardedModuleNames } = require('../../scripts/update/lib/refresh-installation');
const { MODULE_PROFILES } = require('../../scripts/update/lib/config-merger');

const ROOT = path.join(__dirname, '..', '..');
const HEADING = '### Which configs are checked, and which are preserved';

// ─────────────────────────────────────────────────────────────────
// T233. `UPDATE-GUIDE.md` and `INSTALLATION.md` stated which module configs are checked and
// which keep operator values in about ten scattered places, and successive sentence-level
// corrections contradicted each other: every fix reached one passage and broke another the
// author had not read (T223 Round 2 found four such). The instrument is one canonical section
// that every other mention points to.
//
// WHAT THIS PINS — and only this:
//   1. The canonical section exists under its exact heading, so the anchor every pointer
//      targets cannot rot silently.
//   2. The module set in its table is the set the code actually guards.
//   3. The "your values are kept" rows are exactly the modules `mergeConfig` has a profile
//      for. This is the claim that was false in the shipped guides, in both directions.
//   4. Every in-document and cross-document anchor used by either guide resolves.
//
// WHAT THIS DOES NOT PIN. It cannot tell that a NEW contradictory sentence has been added
// somewhere else in either guide — the failure mode T233 exists to stop. No pattern over prose
// did that reliably here; two attempts narrowed to noise. That stays a review responsibility,
// and this file is a floor, not a replacement for the end-to-end read.
// ─────────────────────────────────────────────────────────────────

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

/** GitHub's heading-anchor rule: lowercase, drop punctuation, spaces to hyphens. */
function anchorOf(headingText) {
  return headingText.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');
}

function headingAnchors(body) {
  const seen = new Map();
  for (const [, text] of body.matchAll(/^#{1,6} (.+)$/gm)) {
    const base = anchorOf(text.trim());
    // Duplicate headings get `-1`, `-2`, … appended; model that so a duplicate reddens here
    // rather than silently repointing a link.
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
  }
  return seen;
}

/** The canonical section's body: its heading to the next heading of equal or higher level. */
function canonicalSection(body) {
  const i = body.indexOf(`\n${HEADING}\n`);
  assert.notEqual(i, -1, `${HEADING} is missing from UPDATE-GUIDE.md — every pointer targets it`);
  const rest = body.slice(i + HEADING.length + 2);
  const end = rest.search(/\n#{1,3} /);
  return end === -1 ? rest : rest.slice(0, end);
}

/** `| \`_name\` | <unreadable> | <readable> |` rows of the canonical table. */
function tableRows(section) {
  const rows = [];
  for (const line of section.split('\n')) {
    const m = /^\|\s*`(_[a-z-]+)`\s*\|([^|]*)\|([^|]*)\|\s*$/.exec(line);
    if (m) rows.push({ module: m[1], unreadable: m[2].trim(), readable: m[3].trim() });
  }
  return rows;
}

describe('T233 — the canonical config section is bound to the code it describes', () => {
  const guide = read('UPDATE-GUIDE.md');
  const section = canonicalSection(guide);
  const rows = tableRows(section);

  it('lists exactly the modules whose config the installer guards', () => {
    assert.ok(rows.length > 0, 'the canonical table has no module rows — the parse or the table changed');
    assert.deepEqual(
      rows.map((r) => r.module).sort(),
      [...guardedModuleNames()].sort(),
      'the table and GUARDED_MODULE_NAMES disagree; the guide would be telling operators that a ' +
        'config is checked when it is not, or omitting one that is'
    );
  });

  it('says every guarded config is refused when it cannot be read', () => {
    for (const r of rows) {
      assert.match(r.unreadable, /Refused/,
        `${r.module}: the guard calls assertConfigReadable on it, so the guide must say it refuses`);
    }
  });

  it('marks as kept exactly the modules mergeConfig carries a profile for', () => {
    // The shipped guides had this wrong in BOTH directions: unscoped claims that every config
    // kept operator values, and a later correction that named the wrong three.
    const kept = rows.filter((r) => /kept/i.test(r.readable)).map((r) => r.module).sort();
    const replaced = rows.filter((r) => /Replaced/i.test(r.readable)).map((r) => r.module).sort();

    assert.deepEqual(kept, Object.keys(MODULE_PROFILES).sort(),
      'a module is shown as keeping operator values without a mergeConfig profile, or vice versa');
    assert.deepEqual(
      [...kept, ...replaced].sort(),
      [...guardedModuleNames()].sort(),
      'every row must say either kept or Replaced — an unclassified row is how the ambiguity returns'
    );
    assert.equal(kept.length + replaced.length, rows.length, 'a row was counted twice');
  });

  it('the heading yields the anchor every pointer uses', () => {
    const anchor = anchorOf(HEADING.replace(/^#+ /, ''));
    assert.equal(anchor, 'which-configs-are-checked-and-which-are-preserved');
    assert.ok(guide.includes(`](#${anchor})`), 'UPDATE-GUIDE.md has no pointer to its own canonical section');
  });

  // Each section that USED to restate the facts must carry a pointer. A bare
  // `INSTALLATION.md.includes(pointer)` passed with one of the two deleted — a substring check is
  // not an enumeration check, and the surviving pointer answered for the removed one.
  const RESTATEMENT_SITES = ['## Configuration', '### Config file already exists'];

  for (const site of RESTATEMENT_SITES) {
    it(`INSTALLATION.md "${site.replace(/^#+ /, '')}" points at the canonical section`, () => {
      const inst = read('INSTALLATION.md');
      const i = inst.indexOf(`\n${site}\n`);
      assert.notEqual(i, -1, `INSTALLATION.md no longer has a "${site}" section`);
      const rest = inst.slice(i + site.length + 2);
      const end = rest.search(/\n#{1,3} /);
      const section = end === -1 ? rest : rest.slice(0, end);
      assert.ok(
        section.includes(`](UPDATE-GUIDE.md#${anchorOf(HEADING.replace(/^#+ /, ''))})`),
        `this section restated what is checked and preserved and must point at the canonical ` +
          `section instead; a reader who lands here gets nothing without it`
      );
    });
  }
});

describe('T233 — every anchor the two guides use resolves', () => {
  const files = { 'UPDATE-GUIDE.md': read('UPDATE-GUIDE.md'), 'INSTALLATION.md': read('INSTALLATION.md') };
  const anchors = Object.fromEntries(Object.entries(files).map(([f, b]) => [f, headingAnchors(b)]));

  // A floor per file, stated literally rather than derived from the file — a count taken from the
  // thing under test cannot notice that the scan stopped finding anything. UPDATE-GUIDE.md points
  // within itself; INSTALLATION.md's config pointers all cross into UPDATE-GUIDE.md.
  const FLOOR = { 'UPDATE-GUIDE.md': { within: 1, across: 0 }, 'INSTALLATION.md': { within: 0, across: 1 } };

  // `[^)\s]+` deliberately, not `[-a-z0-9]+`: a narrow class SKIPS a malformed anchor instead of
  // failing on it, which reads as a pass.
  const within = (body) => [...body.matchAll(/\]\((#[^)\s]+)\)/g)].map((m) => m[1].slice(1));
  const across = (body) =>
    [...body.matchAll(/\]\((UPDATE-GUIDE\.md|INSTALLATION\.md)(#[^)\s]+)\)/g)]
      .map((m) => ({ target: m[1], anchor: m[2].slice(1) }));

  for (const [file, body] of Object.entries(files)) {
    it(`${file}: in-document anchors resolve`, () => {
      const targets = within(body);
      assert.ok(targets.length >= FLOOR[file].within,
        `${file}: expected at least ${FLOOR[file].within} in-document anchor link, found ${targets.length} — the scan broke`);
      for (const t of new Set(targets)) {
        assert.ok(anchors[file].has(t), `${file}: #${t} matches no heading in the same file`);
      }
    });

    it(`${file}: cross-document anchors resolve`, () => {
      const links = across(body);
      assert.ok(links.length >= FLOOR[file].across,
        `${file}: expected at least ${FLOOR[file].across} cross-document anchor link, found ${links.length} — the scan broke`);
      for (const { target, anchor } of links) {
        assert.ok(anchors[target].has(anchor),
          `${file}: ${target}#${anchor} matches no heading in ${target}`);
      }
    });
  }

  it('no duplicate heading silently repoints an anchor', () => {
    for (const [file, map] of Object.entries(anchors)) {
      for (const [anchor, n] of map) {
        assert.equal(n, 1, `${file}: heading anchor #${anchor} occurs ${n} times, so links to it are ambiguous`);
      }
    }
  });
});
