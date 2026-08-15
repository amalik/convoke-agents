'use strict';

/**
 * String sanitization helpers shared by the portability exporter and the
 * artifact governance tooling.
 *
 * Both functions replace a one-pass form that is defeated by its own output.
 * CodeQL flags the class as `js/incomplete-multi-character-sanitization` and
 * `js/incomplete-sanitization` (alerts 9-14, issue #7). Each helper documents
 * the concrete input that breaks the naive version, so the reason survives the
 * next person who thinks the extra machinery is redundant.
 *
 * Both reject non-string input rather than coercing it. These helpers decide
 * which file gets rewritten; `escapeRegExp(undefined)` silently building a
 * pattern that matches the literal text `undefined` is the kind of failure that
 * shows up later as a corrupted document, not as a stack trace.
 *
 * @module sanitize
 */

/**
 * Every way the HTML tokenizer ends a comment, not just `-->`.
 *
 * `<!-->` and `<!--->` are the abrupt-closing forms and `--!>` is the
 * comment-end-bang state. A regex recognising only `-->` leaves all three in
 * place — so a template comment written `<!-- internal note --!>` survives the
 * strip and ships inside a user-facing README, which is the exact leak this
 * module exists to prevent. Found by R1 adversarial review, issue #7.
 *
 * The three forms are not equivalent across renderers, and the difference cuts
 * in our favour. `<!-->` and `<!--->` are comments to both the HTML tokenizer
 * and CommonMark. `--!>` is a terminator to the tokenizer only — CommonMark
 * 0.31.2 ends an HTML comment on `-->` alone, so GitHub would swallow *more*
 * than a browser would. Stripping it is therefore the conservative choice
 * under both renderers, not merely the spec-accurate one. Corrected in R3:
 * an earlier version of this comment claimed GitHub treats `--!>` as a
 * terminator, which is false.
 *
 * A new RegExp is built per call: a module-scoped `/g` literal carries
 * `lastIndex` between callers, which is safe under `String.replace` today but
 * breaks silently the moment someone reaches for `.test()` or `.exec()`.
 */
const htmlCommentPattern = () => /<!--(?:>|->|[\s\S]*?--!?>)/g;

/** Every regular-expression metacharacter, per the MDN escape set. */
const REGEXP_METACHARACTERS = /[.*+?^${}()|[\]\\]/g;

/**
 * Iteration budget for {@link stripHtmlComments}. Real documents settle in one
 * or two passes; anything needing more is crafted (see the function's notes).
 */
const MAX_PASSES = 100;

function assertString(value, fn) {
  if (typeof value !== 'string') {
    throw new TypeError(`${fn}: expected a string, received ${value === null ? 'null' : typeof value}`);
  }
}

/**
 * Remove HTML comments, including the ones a single pass would reassemble.
 *
 * One `replace` is not enough: deleting an inner comment splices its
 * neighbours together into a comment that was never in the input as a unit.
 * `'<!-<!--a-->-- b -->'` becomes `'<!--- b -->'` after one pass — a complete,
 * unremoved comment. Repeating until the string stops changing is the fix.
 *
 * Guarantee: the return value contains no complete HTML comment, in any of the
 * tokenizer's four terminator forms.
 *
 * Two explicit non-guarantees, both consequences of the fixed-point loop:
 *
 * 1. A *bare* `<!--` with no terminator can survive. `'<!<!-- x -->-- >'`
 *    reduces to `'<!-- >'`, which no further pass can match. That residue is
 *    malformed input, not a comment; stripping it would mean deleting from the
 *    marker to end-of-input, silently truncating a document whose template
 *    merely has a typo. The residue is *not* harmless to a renderer — GitHub
 *    swallows everything after an unterminated marker — so a caller whose
 *    output ships to users must test for it and raise.
 *    `scripts/portability/convoke-export.js` does exactly that.
 *
 * 2. Conversely, `<!` fragments can be *over*-consumed relative to the HTML
 *    tokenizer. `stripHtmlComments('<!<!----!>-->')` returns `''` where the
 *    spec would render `<!-->`: pass 1 removes the inner comment and splices
 *    `<!` onto `-->`, forming a comment that never existed as a unit, which
 *    pass 2 deletes. Differential fuzzing against a spec tokenizer (R3, 400k
 *    cases) found this only ever consumes `<!`-bracket junk, never readable
 *    text — and a real parser treats a leading `<!` as a bogus comment anyway.
 *    Documented rather than fixed: the alternative is a full tokenizer.
 *
 * Real documents settle in one or two passes. Crafted ones do not: an input of
 * the shape `'<!-'.repeat(k) + '<!--a-->' + '-->'.repeat(k)` peels one layer
 * per pass, making the total work quadratic in the input length — measured at
 * 9.7s for 352KB, against 0.2ms for an 80KB README with no nesting. Convoke
 * only ever strips its own template files, so that is not reachable today, but
 * an uncapped loop is a latent DoS the moment this helper gains a caller with
 * less trusted input. `MAX_PASSES` bounds it; exhausting the budget means the
 * input is adversarial or malformed, and throwing is the honest response.
 *
 * @param {string} input - Raw text, typically a Markdown document.
 * @returns {string} `input` with every complete HTML comment removed.
 * @throws {TypeError} If `input` is not a string.
 * @throws {RangeError} If the nesting exceeds `MAX_PASSES` layers.
 */
function stripHtmlComments(input) {
  assertString(input, 'stripHtmlComments');
  let current = input;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const next = current.replace(htmlCommentPattern(), '');
    if (next === current) return current;
    current = next;
  }
  throw new RangeError(
    `stripHtmlComments: HTML comments still nested after ${MAX_PASSES} passes; ` +
    'input is malformed or adversarial'
  );
}

/**
 * Escape every regular-expression metacharacter so `input` matches literally
 * when interpolated into a `RegExp` **outside a character class**, without the
 * `v` flag.
 *
 * Escaping only `.` is the usual shortcut and it is wrong. `report(v2).md`
 * becomes `report(v2)\.md`, where `(v2)` is now a capture group: the pattern
 * matches `reportv2.md`, misses the real filename, and shifts the arity of
 * every replacer callback after it. An unbalanced `[` throws outright.
 *
 * The context qualifier is load-bearing. Inside a character class this is not
 * enough — `new RegExp('[' + escapeRegExp('a-b') + ']')` yields the range a–z,
 * not three literals — and under the `v` flag `&&` is a reserved punctuator.
 * `RegExp.escape` (ES2025) is class-safe because it does strictly more than
 * this, hex-escaping the hyphen and the leading character; it is also
 * unavailable on Node 18, which `package.json` `engines` still supports.
 *
 * @param {string} input - Literal text to embed in a regular expression.
 * @returns {string} `input` with all metacharacters backslash-escaped.
 * @throws {TypeError} If `input` is not a string.
 */
function escapeRegExp(input) {
  assertString(input, 'escapeRegExp');
  return input.replace(REGEXP_METACHARACTERS, '\\$&');
}

/**
 * Escape `$` in a `String.prototype.replace` **replacement** string so it is
 * inserted literally.
 *
 * Escaping the pattern side is only half the job: `$&`, `` $` ``, `$'` and
 * `$1` are live in the replacement argument, so a filename like `report$&.md`
 * re-injects the matched text into the output. Callers that can use a replacer
 * function should — functions never interpret `$` — and this exists for the
 * ones interpolating into a template literal.
 *
 * @param {string} input - Literal text to use as a replacement.
 * @returns {string} `input` with every `$` doubled.
 * @throws {TypeError} If `input` is not a string.
 */
function escapeReplacement(input) {
  assertString(input, 'escapeReplacement');
  return input.replace(/\$/g, '$$$$');
}

/**
 * Escape a value for a **plain** (non-code-span) markdown table cell.
 *
 * Backslashes first. Escaping `|` inserts backslashes of its own, so the other
 * order doubles them and re-exposes the pipe: `a\|b` would become `a\\|b`,
 * where `\\` is a literal backslash and the `|` is a live cell delimiter again.
 * That is CodeQL alert 10.
 *
 * CR is collapsed alongside LF because CommonMark treats a bare `\r` as a line
 * ending, so it splits the row mid-cell exactly as `\n` does. Runs collapse to
 * a single space rather than one space per character.
 *
 * @param {*} s - Any value; `null`/`undefined` become `''`.
 * @returns {string} A value safe to place between `|` delimiters.
 */
function escapeMarkdownTableCell(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/[\r\n]+/g, ' ');
}

/**
 * Escape a value destined for a **backtick code span** inside a table cell.
 *
 * Code spans follow different rules, so they need their own escaper. `\|` still
 * works, because GFM splits the row on pipes *before* the span is formed — but
 * ordinary backslash escapes are not processed inside a code span, so doubling
 * a backslash here renders two where the source had one. Checked once out of band against
 * GitHub's own renderer (`POST /markdown`, mode=gfm) on 2026-08-15: with this
 * escaper `a\b` and `a\|b` render correctly in 3-cell rows; with the plain
 * escaper they render `a\\b` and `a\\|b`. No renderer is installed in this
 * repo, so that check is NOT reproducible from the test suite — what the tests
 * pin is the escaper's output, not how a renderer treats it. Applying the plain one to a code span was an R1
 * regression during issue #7 — do not "simplify" these back into one function.
 *
 * Not handled: a backtick in the value closes the span early. Skill names are
 * not validated to exclude one (nothing in `manifest-csv.js` constrains the
 * `name` column), so this is unguarded rather than impossible — tracked as T34.
 *
 * @param {*} s - Any value; `null`/`undefined` become `''`.
 * @returns {string} A value safe to place inside backticks between `|`.
 */
function escapeMarkdownCodeSpanCell(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\|/g, '\\|')
    .replace(/[\r\n]+/g, ' ');
}

module.exports = {
  stripHtmlComments,
  escapeRegExp,
  escapeReplacement,
  escapeMarkdownTableCell,
  escapeMarkdownCodeSpanCell,
  MAX_PASSES
};
