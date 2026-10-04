'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { guardedModuleNames, mergedModuleNames } = require('../../scripts/update/lib/refresh-installation');

const ROOT = path.join(__dirname, '..', '..');
const HEADING = 'Which configs are checked, and which are preserved';
const ANCHOR = 'which-configs-are-checked-and-which-are-preserved';
const GUIDES = ['UPDATE-GUIDE.md', 'INSTALLATION.md'];

// ─────────────────────────────────────────────────────────────────
// T233. The two guides stated which module configs are checked and which keep operator values
// in about a dozen scattered places, and successive corrections contradicted each other. The
// instrument is one canonical section in UPDATE-GUIDE.md that every other mention points to.
//
// WHAT THIS ASSERTS
//   1. UPDATE-GUIDE.md contains the canonical section, at any heading level.
//   2. Its table lists exactly the modules the installer guards, and every row that GFM would
//      render is parsed — outer pipes are optional in GFM, so a row without them must not slip
//      past. An unparsable row fails rather than being skipped.
//   3. The rows whose readable-column verdict is "Your values are kept" are exactly the modules
//      a refresh actually MERGES (`mergedModuleNames()`, measured by seeding a key and refreshing —
//      not `MODULE_PROFILES`, which is necessary but not sufficient; see T239 Round 1). Classification reads the verdict the cell LEADS with, so
//      "Your values are **not kept**" is not a kept row.
//   4. Every unreadable-column verdict leads with "Refused".
//   5. The two verdict columns are located by their header text, not by position.
//   6. Each section that used to restate the facts still contains the pointer.
//   7. Same-file `#` anchors and anchors between the two guides resolve to a real heading.
//
// WHAT THIS DOES NOT ASSERT — the holes, named, because a backlog receipt cites this file as
// T233's re-derivation instrument:
//   - Prose. Nothing outside the table is read, so a sentence under it, or anywhere else in
//     either guide, can contradict the table and this stays green. That is the exact failure mode
//     T233 exists to stop and it remains a review duty (`T243`).
//   - A SECOND table. Only UPDATE-GUIDE.md's canonical section is parsed, so a copy of the table
//     elsewhere — including in INSTALLATION.md — is unchecked (`T246`).
//   - Cell text after the leading verdict, and link text, are free (`T246`).
//   - Cross-file anchors into a third file. `scripts/audit/reference-integrity.js` catches those
//     and this does not; verified by breaking one and watching that gate exit 1. It does NOT
//     catch a broken same-file `#anchor`, which is why item 7 exists.
//   - `anchorOf` approximates GitHub's slugger; a heading containing inline markup or HTML can
//     differ (`T247`).
// ─────────────────────────────────────────────────────────────────

// One read per file per process. Two reads inside a single assertion can compare new links
// against old headings while a file is being edited, which reports a defect true of no version.
const _cache = new Map();
function read(f) {
  if (!_cache.has(f)) _cache.set(f, fs.readFileSync(path.join(ROOT, f), 'utf8'));
  return _cache.get(f);
}

/** Drop fenced regions, so a `#` comment in a shell example is not read as a heading. */
function stripFences(body) {
  return body.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
}

/**
 * Emphasis and code markers removed, so `**Refused**` and `Refused` compare equal. `_` is NOT
 * stripped: it is the first character of every module name, and stripping it made every row of
 * the table unparsable.
 */
const plain = (s) => String(s).replace(/[*`]/g, '').trim();

/** GFM row cells: the outer pipes are optional and `\|` is not a delimiter. */
function cellsOf(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((c) => c.trim());
}

function anchorOf(headingText) {
  return headingText.toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replace(/ /g, '-');
}

function headingsOf(body) {
  return [...stripFences(body).matchAll(/^#{1,6} (.+)$/gm)].map((m) => m[1].trim());
}

/** Anchors a file defines, with GitHub's `-1`, `-2` … disambiguation for repeats. */
function headingAnchors(body) {
  const counts = new Map();
  const defined = new Set();
  for (const text of headingsOf(body)) {
    const base = anchorOf(text);
    const n = counts.get(base) || 0;
    counts.set(base, n + 1);
    defined.add(n === 0 ? base : `${base}-${n}`);
  }
  return defined;
}

/** A section's body, located by heading TEXT at whatever level it carries. */
function sectionOf(body, headingText) {
  const stripped = stripFences(body);
  const re = new RegExp(`^(#{1,6}) ${headingText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ \t]*$`, 'm');
  const m = re.exec(stripped);
  assert.ok(m, `"${headingText}" is missing — or was renamed, in which case update this test deliberately`);
  const rest = stripped.slice(m.index + m[0].length);
  const end = rest.search(new RegExp(`\\n#{1,${m[1].length}} `));
  return end === -1 ? rest : rest.slice(0, end);
}

/**
 * The canonical table: its header row through the first blank line, which is where GFM ends a
 * table too. Scoping to the block rather than to the whole section lets the section hold other
 * tables and sub-headings without this failing.
 */
function tableOf(section) {
  const lines = section.split('\n');
  const h = lines.findIndex((l) => {
    const c = cellsOf(l);
    return c.length >= 3 && /^module config$/i.test(plain(c[0]));
  });
  assert.notEqual(h, -1, 'the canonical section has no table whose first column is "Module config"');

  const header = cellsOf(lines[h]).map(plain);
  const sep = cellsOf(lines[h + 1]);
  assert.ok(sep.length === header.length && sep.every((c) => /^:?-+:?$/.test(c)),
    `expected a delimiter row of ${header.length} cells under the table header, got: ${lines[h + 1]}`);

  const iUnreadable = header.findIndex((c) => /cannot be read/i.test(c));
  const iReadable = header.findIndex((c) => /can be read/i.test(c) && !/cannot be read/i.test(c));
  assert.notEqual(iUnreadable, -1, `no "cannot be read" column in: ${header.join(' | ')}`);
  assert.notEqual(iReadable, -1, `no "can be read" column in: ${header.join(' | ')}`);

  const rows = [];
  for (let i = h + 2; i < lines.length && lines[i].trim() !== ''; i++) {
    const c = cellsOf(lines[i]);
    const name = /^(_[a-z0-9_-]+)$/.exec(plain(c[0]));
    assert.ok(name && c.length === header.length,
      `unparsable row in the canonical table, so no assertion below sees it: ${lines[i]}`);
    rows.push({ module: name[1], unreadable: c[iUnreadable], readable: c[iReadable] });
  }
  return rows;
}

// Verdicts are read from what the cell LEADS with. A substring test counted
// "Your values are **not kept**" as kept and "Not **Refused**" as refused.
const leadsWith = (cell, verdict) => plain(cell).toLowerCase().startsWith(verdict);
const isKept = (c) => leadsWith(c, 'your values are kept');
const isReplaced = (c) => leadsWith(c, 'replaced');
const isRefused = (c) => leadsWith(c, 'refused');

describe('T233 — the verdict classifiers read a statement, not a keyword', () => {
  it('accepts the verdicts the table uses', () => {
    assert.ok(isKept('**Your values are kept**'));
    assert.ok(isReplaced('**Replaced** by the package template, so anything you added is lost'));
    assert.ok(isRefused('**Refused** — the run stops and names the file'));
    assert.ok(isRefused('Refused'), 'emphasis and case must not matter');
  });

  it('rejects a negation of each verdict', () => {
    assert.ok(!isKept('Your values are **not kept**'), 'a negated cell must not count as kept');
    assert.ok(!isRefused('Not **Refused** — the install proceeds'));
    assert.ok(!isReplaced('Never **Replaced**'));
    assert.ok(!isKept('**Replaced**, your own keys surviving'), 'kept must not be found mid-cell');
  });
});

describe('T233 — the canonical table is bound to the code it describes', () => {
  const table = () => tableOf(sectionOf(read('UPDATE-GUIDE.md'), HEADING));

  it('lists exactly the modules whose config the installer guards', () => {
    const rows = table();
    assert.ok(rows.length > 0, 'the canonical table has no module rows');
    assert.deepEqual(rows.map((r) => r.module).sort(), [...guardedModuleNames()].sort(),
      'the table and GUARDED_MODULE_NAMES disagree; the guide would be telling operators that a ' +
        'config is checked when it is not, or omitting one that is');
  });

  it('says every guarded config is refused when it cannot be read', () => {
    const rows = table();
    assert.ok(rows.length > 0, 'no rows to check — this would otherwise pass vacuously');
    for (const r of rows) {
      assert.ok(isRefused(r.unreadable),
        `${r.module}: the guard calls assertConfigReadable on it, so its unreadable column must ` +
          `lead with "Refused" — found: ${r.unreadable}`);
    }
  });

  it('marks as kept exactly the modules a refresh merges', () => {
    const rows = table();
    const kept = rows.filter((r) => isKept(r.readable)).map((r) => r.module).sort();
    const replaced = rows.filter((r) => isReplaced(r.readable)).map((r) => r.module).sort();

    // `mergedModuleNames()`, NOT `Object.keys(MODULE_PROFILES)`. T239 Round 1 established that a
    // profile is necessary but not sufficient — preservation is decided by which write site a
    // module reaches. Pinned to the profile table, this test REQUIRED the guide to claim a
    // wholesale-copied module keeps values the moment a profile was added for it.
    assert.deepEqual(kept, [...mergedModuleNames()].sort(),
      'a module is shown as keeping operator values that a refresh does not merge, or vice versa');
    assert.equal(kept.length + replaced.length, rows.length,
      'a row was neither classified as kept nor as Replaced, which is how the ambiguity returns');
    assert.deepEqual([...kept, ...replaced].sort(), [...guardedModuleNames()].sort(),
      'the two classes together must be exactly the guarded set — no row double-counted, none missing');
  });
});

// Each section that restated the facts before T233 must still carry a pointer. Enumerated per
// section: a whole-file substring check stayed green with all but one pointer deleted.
const POINTER_SITES = {
  'UPDATE-GUIDE.md': [
    "What's Never Touched",
    'What Gets Updated',
    'What Is Managed by the Update System',
    '"refusing to overwrite ... config.yaml"',
    '"Installation appears corrupted"',
  ],
  'INSTALLATION.md': ['Configuration', 'Config file already exists'],
};

describe('T233 — every section that used to restate the facts points at them instead', () => {
  it('the site list still covers every section it was built from', () => {
    assert.equal(Object.values(POINTER_SITES).flat().length, 7,
      'emptying or trimming POINTER_SITES removes tests from the run without failing anything');
  });

  for (const [file, sites] of Object.entries(POINTER_SITES)) {
    for (const site of sites) {
      it(`${file} "${site}"`, () => {
        const section = sectionOf(read(file), site);
        const hit = file === 'UPDATE-GUIDE.md'
          ? section.includes(`#${ANCHOR})`)
          : section.includes(`UPDATE-GUIDE.md#${ANCHOR})`);
        assert.ok(hit, 'this section restated what is checked and preserved; a reader who lands ' +
          'here gets nothing unless it points at the canonical section');
      });
    }
  }
});

describe('T233 — the anchors the two guides use resolve', () => {
  // Every link carrying a `#`, in either inline or reference form, so an unrecognised spelling
  // is not silently dropped. Fences are stripped: a markdown example must not have to resolve.
  function links(file) {
    const body = stripFences(read(file));
    const raw = [
      ...[...body.matchAll(/\]\(([^)\s]*#[^)\s]+)\)/g)].map((m) => m[1]),
      ...[...body.matchAll(/^\[[^\]]+\]:[ \t]*(\S*#\S+)/gm)].map((m) => m[1]),
    ];
    return raw.map((t) => {
      const i = t.indexOf('#');
      return { from: file, file: t.slice(0, i).replace(/^\.\//, ''), anchor: t.slice(i + 1) };
    });
  }

  // A floor only has to notice that the scan stopped returning anything. Freezing it at today's
  // count made removing an unrelated link fail as "the scan broke", which was false.
  it('the link scan still finds links in both guides', () => {
    for (const f of GUIDES) {
      assert.ok(links(f).length >= 2, `${f}: found ${links(f).length} anchor links — the scan broke`);
    }
  });

  it('each same-file and inter-guide anchor points at a real heading', () => {
    const defined = Object.fromEntries(GUIDES.map((f) => [f, headingAnchors(read(f))]));
    for (const f of GUIDES) {
      for (const l of links(f)) {
        // A third file's anchors belong to reference-integrity.js, which does catch them.
        if (l.file !== '' && !GUIDES.includes(l.file)) continue;
        const where = l.file === '' ? f : l.file;
        assert.ok(defined[where].has(l.anchor),
          `${f}: ${l.file}#${l.anchor} matches no heading in ${where}`);
      }
    }
  });

  it('no anchor a guide links to is ambiguous', () => {
    // GitHub disambiguates a repeated heading with `-1`, so duplicates are only a problem when
    // something links to the ambiguous base.
    for (const f of GUIDES) {
      const seen = new Map();
      for (const text of headingsOf(read(f))) {
        const a = anchorOf(text);
        seen.set(a, (seen.get(a) || 0) + 1);
      }
      const linked = new Set(links(f).filter((l) => l.file === '' || l.file === f).map((l) => l.anchor));
      for (const [a, n] of seen) {
        if (n > 1 && linked.has(a)) {
          assert.fail(`${f}: #${a} is defined by ${n} headings and linked, so the link is ambiguous`);
        }
      }
    }
  });

  it('the canonical heading yields the anchor the pointers use', () => {
    assert.equal(anchorOf(HEADING), ANCHOR);
    assert.ok(headingAnchors(read('UPDATE-GUIDE.md')).has(ANCHOR),
      'UPDATE-GUIDE.md defines no heading with the anchor every pointer targets');
  });
});
