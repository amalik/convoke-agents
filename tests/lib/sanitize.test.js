'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  stripHtmlComments,
  escapeRegExp,
  escapeReplacement,
  escapeMarkdownTableCell,
  escapeMarkdownCodeSpanCell,
  MAX_PASSES
} = require('../../scripts/lib/sanitize');

describe('stripHtmlComments', () => {
  it('removes a plain comment', () => {
    assert.equal(stripHtmlComments('a<!-- note -->b'), 'ab');
  });

  it('removes several sibling comments', () => {
    assert.equal(stripHtmlComments('<!--a-->x<!--b-->y'), 'xy');
  });

  it('removes a multi-line comment', () => {
    assert.equal(stripHtmlComments('a<!--\nline1\nline2\n-->b'), 'ab');
  });

  it('leaves comment-free text untouched', () => {
    const input = '# Heading\n\nBody with <angle> and -- dashes.\n';
    assert.equal(stripHtmlComments(input), input);
  });

  // The regression this module exists for: one pass splices the surviving
  // fragments into a *complete* comment that was never in the input as a unit,
  // and then leaves it there. See CodeQL
  // js/incomplete-multi-character-sanitization, issue #7.
  it('removes a comment that a single pass reassembles', () => {
    const input = '<!-<!--a-->-- b -->';
    const onePass = input.replace(/<!--[\s\S]*?-->/g, '');
    assert.match(
      onePass,
      /<!--[\s\S]*?-->/,
      `fixture no longer exercises reassembly — one pass left ${JSON.stringify(onePass)}`
    );
    assert.equal(stripHtmlComments(input), '');
  });

  // Documented non-guarantee: a bare marker with no terminator is malformed
  // input, not a comment. Stripping it would mean deleting to end-of-input and
  // silently truncating the document, so it is left visible instead.
  it('leaves a bare unterminated marker in place', () => {
    assert.equal(stripHtmlComments('before <!-- dangling'), 'before <!-- dangling');
    assert.equal(stripHtmlComments('<!<!-- x -->-- >'), '<!-- >');
  });

  // R1 HIGH: `-->` is not the only terminator. `<!-->` and `<!--->` are the
  // abrupt-closing forms and `--!>` is the comment-end-bang state — all three
  // are complete comments to a browser and to GitHub's renderer. The previous
  // regex recognised only `-->`, so `<!-- internal note --!>` shipped inside
  // exported READMEs. Expected outputs are hand-written on purpose: asserting
  // "output does not match HTML_COMMENT" would restate the loop's own exit
  // condition and pass vacuously for any fixed-point implementation, which is
  // exactly why the original test missed this.
  it('removes every HTML comment terminator form', () => {
    const cases = [
      ['<!-- normal -->', ''],
      ['<!-->', ''],
      ['<!--->', ''],
      ['<!-- x --!>', ''],
      ['a<!-- x --!>b', 'ab'],
      ['a<!-->b<!--->c', 'abc']
    ];
    for (const [input, expected] of cases) {
      assert.equal(
        stripHtmlComments(input),
        expected,
        `wrong output for ${JSON.stringify(input)}`
      );
    }
  });

  // The negative cases are what make the alternation ORDER load-bearing. If the
  // `>` / `->` branches were moved after the lazy general branch, or the lazy
  // branch lost its laziness, these two would break while the positive cases
  // above kept passing. R3.
  it('does not treat comment-adjacent text as a terminator', () => {
    // `<!-- ->` is comment-end-dash then "anything else" — not a comment.
    assert.equal(stripHtmlComments('<!-- ->'), '<!-- ->');
    // `<!--- x -->` is a normal comment with a leading dash in the body.
    assert.equal(stripHtmlComments('<!--- x -->'), '');
    // Laziness: the first terminator wins, the rest is content.
    assert.equal(stripHtmlComments('a<!--x-->b-->c'), 'ab-->c');
  });

  it('throws rather than coercing non-string input', () => {
    for (const bad of [42, null, undefined, ['<!--a-->'], {}, Object.create(null)]) {
      assert.throws(() => stripHtmlComments(bad), TypeError);
    }
  });

  // Uncapped, this shape is quadratic: one layer peeled per pass. Measured at
  // 9.7s for 352KB before the cap landed.
  it('throws instead of grinding on deeply nested markers', () => {
    const adversarial = '<!-'.repeat(MAX_PASSES + 10) + '<!--a-->' + '-->'.repeat(MAX_PASSES + 10);
    assert.throws(() => stripHtmlComments(adversarial), RangeError);
  });

  // R3: the previous version of this test asserted only "no marker remains",
  // which passes with MAX_PASSES set to 2 and so pinned nothing about the
  // budget. Counting passes directly is the assertion that has teeth — a
  // realistic document must settle in far fewer passes than the cap, or the cap
  // is not protecting anything.
  it('settles a realistic document in a small, bounded number of passes', () => {
    const readme = '# Title\n<!-- dev note -->\nbody text here\n'.repeat(2000);

    let passes = 0;
    let current = readme;
    for (;;) {
      const next = current.replace(/<!--(?:>|->|[\s\S]*?--!?>)/g, '');
      passes++;
      if (next === current) break;
      current = next;
    }

    assert.equal(stripHtmlComments(readme), current);
    assert.ok(!current.includes('<!--'), 'markers survived');
    assert.ok(passes <= 3, `realistic document needed ${passes} passes`);
    assert.ok(MAX_PASSES > passes * 10, `MAX_PASSES=${MAX_PASSES} leaves no headroom over ${passes}`);
  });
});

describe('escapeRegExp', () => {
  it('escapes every metacharacter in the MDN set', () => {
    for (const char of ['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\']) {
      const pattern = new RegExp(`^${escapeRegExp(char)}$`);
      assert.ok(pattern.test(char), `escapeRegExp did not make ${JSON.stringify(char)} literal`);
    }
  });

  it('leaves ordinary characters alone', () => {
    assert.equal(escapeRegExp('convoke-note-backlog-2026-08-15'), 'convoke-note-backlog-2026-08-15');
  });

  // The regression this helper exists for: escaping only `.` turns `(v2)` into
  // a capture group, so the pattern matches the wrong name and misses the real
  // one. See CodeQL js/incomplete-sanitization, issue #7.
  it('matches a filename whose parentheses a dot-only escape would turn into a group', () => {
    const filename = 'report(v2).md';
    const dotOnly = new RegExp(`^${filename.replace(/\./g, '\\.')}$`);
    assert.ok(!dotOnly.test(filename), 'fixture no longer exercises the gap');
    assert.ok(dotOnly.test('reportv2.md'), 'fixture no longer exercises the mismatch');

    const escaped = new RegExp(`^${escapeRegExp(filename)}$`);
    assert.ok(escaped.test(filename));
    assert.ok(!escaped.test('reportv2.md'));
  });

  it('does not throw on a filename with an unbalanced bracket', () => {
    const filename = 'draft[1.md';
    assert.throws(() => new RegExp(filename.replace(/\./g, '\\.')), SyntaxError);
    assert.ok(new RegExp(`^${escapeRegExp(filename)}$`).test(filename));
  });

  it('throws rather than coercing non-string input', () => {
    for (const bad of [1.5, null, undefined, {}, Object.create(null)]) {
      assert.throws(() => escapeRegExp(bad), TypeError);
    }
  });
});

describe('escapeReplacement', () => {
  // Escaping the pattern side is half the job: `$&` is live in the replacement
  // argument, so a filename like `report$&.md` re-injects the matched text.
  it('neutralises $-sequences that would re-inject matched text', () => {
    const naive = 'xAy'.replace(/A/, 'report$&.md');
    assert.equal(naive, 'xreportA.mdy', 'fixture no longer exercises the gap');

    const safe = 'xAy'.replace(/A/, escapeReplacement('report$&.md'));
    assert.equal(safe, 'xreport$&.mdy');
  });

  it('handles every live $-sequence', () => {
    for (const raw of ['$&', '$`', "$'", '$1', '$$']) {
      assert.equal('xAy'.replace(/A/, escapeReplacement(raw)), `x${raw}y`);
    }
  });

  it('leaves $-free text alone', () => {
    assert.equal(escapeReplacement('report-v2.md'), 'report-v2.md');
  });

  it('throws rather than coercing non-string input', () => {
    assert.throws(() => escapeReplacement(null), TypeError);
  });
});

// --- Markdown table-cell escapers (moved here from validate-classification.js
// by BUG-12, which consolidated four divergent copies into one) ---
//
// R1 on that consolidation flagged that promoting these to a shared module left
// them with no tests at the shared boundary. R2 on the tests that answered that
// flag found the first attempt still let a non-global `replace` through — the
// canonical form of the very CodeQL class this module exists to close. Every
// fixture below therefore carries MULTIPLE occurrences of what it escapes.
//
// An earlier revision of this block carried a `cellDelims` helper that counted
// a pipe as live unless preceded by an ODD number of backslashes. R2 disproved
// it against GitHub's renderer: GFM escapes a pipe whenever it is IMMEDIATELY
// preceded by a backslash, with no run parity, so `a\\|b` is one cell and the
// helper predicted two. It also killed zero mutants that the string-equality
// assertions did not already kill. Removed rather than corrected — asserting
// the exact output string is both stronger and honest about what it models.

describe('escapeMarkdownTableCell', () => {
  it('escapes EVERY pipe, not just the first', () => {
    assert.equal(escapeMarkdownTableCell('a|b|c'), 'a\\|b\\|c');
  });

  it('escapes EVERY backslash, not just the first', () => {
    assert.equal(escapeMarkdownTableCell('a\\b\\c'), 'a\\\\b\\\\c');
  });

  // Ordering is pinned, but NOT for the reason an earlier version of this
  // comment gave. It said the wrong order hands the pipe back to the table
  // parser; R2 and R3 disproved that against GitHub's renderer over 492
  // cases — both orderings render identically, one cell, data intact.
  // What alert 10 actually reports is a missing backslash pass, whose
  // consequence is silent character loss (`a\|b` renders as `a|b`). This
  // test pins the canonical output shape; see the rationale on
  // escapeMarkdownTableCell in scripts/lib/sanitize.js.
  it('escapes backslashes BEFORE pipes, not after', () => {
    assert.equal(escapeMarkdownTableCell('a\\|b'), 'a\\\\\\|b');

    const wrongOrder = (s) => String(s).replace(/\|/g, '\\|').replace(/\\/g, '\\\\');
    assert.notEqual(
      wrongOrder('a\\|b'),
      escapeMarkdownTableCell('a\\|b'),
      'fixture no longer distinguishes the two orderings'
    );
  });

  it('collapses each newline run to a single space, every run', () => {
    assert.equal(escapeMarkdownTableCell('a\nb\nc'), 'a b c');
    assert.equal(escapeMarkdownTableCell('a\r\nb'), 'a b');
    assert.equal(escapeMarkdownTableCell('a\rb'), 'a b');
    // Runs collapse to ONE space. This differs from the pre-BUG-12
    // validate-classification copy, which emitted one space per newline.
    assert.equal(escapeMarkdownTableCell('a\n\nb'), 'a b');
    assert.equal(escapeMarkdownTableCell('a\r\n\r\nb'), 'a b');
  });

  it('handles pipes and newlines together', () => {
    assert.equal(escapeMarkdownTableCell('a|b\nc|d'), 'a\\|b c\\|d');
  });

  it('leaves a backtick alone — plain cells are not code spans', () => {
    assert.equal(escapeMarkdownTableCell('a`b`c'), 'a`b`c');
  });

  it('returns empty string for nullish, and stringifies everything else', () => {
    assert.equal(escapeMarkdownTableCell(null), '');
    assert.equal(escapeMarkdownTableCell(undefined), '');
    assert.equal(escapeMarkdownTableCell(0), '0');
    assert.equal(escapeMarkdownTableCell(false), 'false');
    assert.equal(escapeMarkdownTableCell(''), '');
  });
});

describe('escapeMarkdownCodeSpanCell', () => {
  it('escapes EVERY pipe (GFM resolves \\| before the code span forms)', () => {
    assert.equal(escapeMarkdownCodeSpanCell('a|b|c'), 'a\\|b\\|c');
  });

  // The distinction that makes two escapers necessary: backslash escapes are
  // NOT processed inside a code span, so doubling one renders two where the
  // source had one. Applying the plain escaper here was an R1 regression during
  // issue #7 — this test is what stops it coming back.
  it('does NOT escape backslashes, unlike the plain-cell escaper', () => {
    assert.equal(escapeMarkdownCodeSpanCell('a\\b\\c'), 'a\\b\\c');
    assert.equal(escapeMarkdownTableCell('a\\b\\c'), 'a\\\\b\\\\c');
    assert.notEqual(
      escapeMarkdownCodeSpanCell('a\\b'),
      escapeMarkdownTableCell('a\\b')
    );
  });

  it('collapses newline runs like the plain escaper', () => {
    assert.equal(escapeMarkdownCodeSpanCell('a\nb\nc'), 'a b c');
    assert.equal(escapeMarkdownCodeSpanCell('a\rb'), 'a b');
    assert.equal(escapeMarkdownCodeSpanCell('a\n\nb'), 'a b');
  });

  it('returns empty string for nullish, and stringifies everything else', () => {
    assert.equal(escapeMarkdownCodeSpanCell(null), '');
    assert.equal(escapeMarkdownCodeSpanCell(undefined), '');
    assert.equal(escapeMarkdownCodeSpanCell(0), '0');
    assert.equal(escapeMarkdownCodeSpanCell(false), 'false');
    assert.equal(escapeMarkdownCodeSpanCell(''), '');
  });

  // Known unguarded input, tracked as T34: a backtick closes the span early.
  // Pinned as a NORMAL assertion on purpose. R2 showed a `todo` variant can
  // never signal — node:test keeps exit 0 for a failing todo — and that the
  // inverted form let a strip-backticks implementation through unnoticed.
  // This fails loudly when T34 lands, which is the right signal for a
  // deliberate behaviour change.
  it('passes a backtick through unescaped — T34 will change this', () => {
    assert.equal(escapeMarkdownCodeSpanCell('a`b'), 'a`b');
  });
});
