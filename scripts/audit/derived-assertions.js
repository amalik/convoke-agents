#!/usr/bin/env node

'use strict';

/**
 * Report a FLOOR on the derived assertions in a markdown document.
 *
 * A derived assertion is a statement a reader can act on and be wrong about: a command they run,
 * a path they open, a count they repeat, a version they rely on. This script finds them so the
 * docs-accuracy epic can size its remaining stories against a measurement instead of an estimate.
 *
 * ⚠ IT REPORTS A FLOOR, NOT A COUNT, AND SAYS SO IN ITS OWN OUTPUT.
 * Two review rounds found class after class the pattern set missed — several in Round 1, more in
 * Round 2 *after* Round 1's fixes. `code-review-convergence` says two failed attempts at the same
 * fix predict a third, so the claim was narrowed rather than the patterns widened again. Every
 * figure this script emits is a LOWER BOUND under the pinned pattern set below.
 *
 * **How many classes remain is not written here, because it changes.** The RESIDUAL (see below)
 * reports it at run time; prose cannot. Treat the output as ordinally useful — which file is
 * heavier — and not as a census. A floor is honest and still sizes work; a "count" that keeps
 * growing under review is neither. `T160` owns the remaining classes.
 *
 * It COUNTS AND REPORTS. It never edits a document. That prohibition is not stylistic — this epic
 * deleted two purpose-built checkers (backlog `T142`), the second of which regenerated the very
 * defect it was built to catch into two shipped files, with a green gate, because it could write.
 *
 * WHAT IT IS FOR, AND THE FAILURE MODE THAT MATTERS
 * The output sizes Stories 1.5 and 1.6 as well as 1.4. So the dangerous failure is not a crash or
 * a false positive — it is a pattern that fires INCOMPLETELY and silently, which makes every
 * downstream story look cheaper than it is. Two things guard that, and neither is optional:
 *   1. `--self-check` runs the pattern set against a fixture holding a known assertion of each
 *      kind and EXITS 1 if any kind fires zero times. A silent kind is a broken pattern.
 *   2. Completeness is checked by hand-derivation of a sample window, not by re-running this
 *      script. It is deterministic: re-running reproduces the same wrong number and tests nothing.
 *
 * FENCED CODE BLOCKS ARE COUNTED (Story 1.4 AC1, ruled explicitly).
 * A command inside a ```bash block is a command the reader runs. Excluding fence bodies would
 * count the prose ABOUT an instruction and not the instruction. `FENCE_RE` is used ONLY to avoid
 * counting the fence DELIMITER lines themselves, never to skip their contents.
 *
 * WHY `stripInlineCode` IS NOT USED, THOUGH THIS FILE'S STORY RECOMMENDED IT.
 * That helper masks inline-code spans, replacing their contents with spaces, because its caller
 * (`assert-shipped-links.js`) needs to EXCLUDE code. This counter needs the opposite: AC1 defines
 * a Path as one written "in backticks or in a link target", and commands are written as code far
 * more often than not, so masking spans would blank out much of what this script exists to find. The
 * CommonMark run-matching rule is reused — a span closes on a backtick run of EQUAL length, and an
 * opening run with no partner is literal text — but inverted to RETURN the spans. Verified:
 * `stripInlineCode('Run `npm test` now')` yields `'Run            now'`.
 */

const fs = require('fs');
const path = require('path');
const { FENCE_RE } = require('./lib/shipped-links');
const { findProjectRoot } = require('../update/lib/utils');

/**
 * The shipped binaries, derived from `package.json` `bin` rather than listed here — adding a
 * binary must not require editing this file (`derive-counts-from-source`). Memoised because
 * `accept` runs per match.
 */
let BIN_NAMES = null;
function binNames() {
  if (BIN_NAMES) return BIN_NAMES;
  const pkg = path.join(findProjectRoot(__dirname), 'package.json');
  BIN_NAMES = new Set(Object.keys(JSON.parse(fs.readFileSync(pkg, 'utf8')).bin || {}));
  return BIN_NAMES;
}

/**
 * The pinned pattern set. One array, in one file, so `git diff` shows any change that Stories
 * 1.5 and 1.6 would inherit. Deliberately NOT a separate data file.
 *
 * `zone` says where a kind is looked for:
 *   'code'  — inside a fenced block, or inside an inline code span, or a link target
 *   'prose' — outside code
 *   'any'   — both
 *
 * Every `re` must be global; `scan` relies on `lastIndex`.
 */
const PATTERNS = [
  {
    kind: 'command',
    zone: 'code',
    // CODE zone, not 'any'. A tool plus a following word is not enough to distinguish an
    // invocation from prose — the fixture's "The npm registry is where..." and "We use git for
    // version control" both satisfy tool+word. What actually distinguishes them is that an
    // instruction the reader runs is written as code. This implements AC1's "prose mentioning a
    // tool by name without an invocation" exclusion; a word-list of subcommands would not, and
    // would rot.
    re: /(?:^|[\s$>(`])((?:npm|npx|node|git|pnpm|yarn)\s+[a-z][\w:./-]*(?:\s+[\w./:@=-]+)*)/g,
    note: 'A tool invocation inside code. Bare tool names in prose do not count, by zone.',
  },
  {
    kind: 'command',
    zone: 'any',
    // The product's own binaries are invocations even with no subcommand — `convoke-doctor` IS
    // the whole command. Which names are binaries is DERIVED from package.json `bin`, not listed
    // here: `convoke-agents` is the package name and appears throughout UPDATE-GUIDE.md in rename
    // notes ("`bmad-enhanced` → `convoke-agents`"), which are not invocations. Hand-derivation
    // caught it counting those as commands.
    re: /(?:^|[\s$>(`])(convoke-[a-z][a-z0-9-]*)(?!@)\b/g,
    note: 'A convoke-* binary, checked against package.json `bin` in accept().',
  },
  {
    kind: 'command',
    zone: 'any',
    // Slash commands are what a reader types into the agent surface.
    re: /(?:^|[\s(`"'])(\/bmad-[a-z0-9][a-z0-9-]*)/g,
    note: 'A /bmad-* slash command.',
  },
  {
    kind: 'path',
    zone: 'code',
    // A repository path: at least one slash, path-ish characters, no scheme. Restricted to code
    // zones and link targets so ordinary prose containing a slash ("and/or") cannot match.
    // The final segment is OPTIONAL so a bare directory counts. Requiring it missed `_bmad/` —
    // found by AC2's hand-derivation of UPDATE-GUIDE.md:100-121, not by any test, and it is the
    // undercount class this story was written to catch.
    re: /(?:^|[\s('"[<`])((?:\.{1,2}\/|\/)?(?:[\w.@-]+\/)+[\w.@-]*)/g,
    note: 'A repository path in a code span, fence body, or link target; a bare directory counts.',
  },
  {
    kind: 'path',
    zone: 'code',
    // A FILENAME with no directory prefix. AC1 defines a Path structurally — "in backticks or in
    // a link target" — so the test is the shape of the token, not membership of a list. An
    // earlier version carried an 11-entry allowlist of root files; it missed every other
    // backticked filename (`agent-registry.js`, `hc1-empathy-artifacts.md`, four `.yaml`
    // contracts in `docs/faq.md` alone) and was a hardcoded inventory of repository files that
    // would rot on any rename (`derive-counts-from-source`). Found by review, not by any test.
    re: /(?:^|[\s('"[<`])([\w.@-]+\.(?:md|js|mjs|cjs|ts|json|csv|ya?ml|sh|toml|lock|txt))\b/g,
    note: 'A filename with a known extension, named without a directory prefix.',
  },
  {
    kind: 'path',
    zone: 'code',
    // Dotfiles a reader is pointed at carry no extension after the leading dot.
    re: /(?:^|[\s('"[<`])(\.(?:gitignore|npmrc|nvmrc|editorconfig))\b/g,
    note: 'A root dotfile, which has no extension for the filename rule to match.',
  },
  {
    kind: 'count',
    // 'any', not 'prose'. AC1 rules that fenced bodies ARE counted, and this file's header says
    // so — but `count` carried zone 'prose', and `scan` treats a whole fenced line as a code
    // zone, so NO count inside a fence was ever counted. Invisible on this story's two files (they
    // lose none) and worth a material number across the files Stories 1.5 and 1.6 are sized on.
    // The ruling's own text warned it "would silently propagate to 1.5 and 1.6"; it did.
    zone: 'any',
    // A number asserted about this repository. The noun list is what makes it an assertion about
    // the product rather than arithmetic in an example.
    //
    // Up to two qualifiers may sit between the number and the noun. WITHOUT this the pattern
    // misses "seven Vortex agents" and "4 Gyre agents" — which is the identical adjacency defect
    // `docs-audit.js` carries and that this story's AC6 exists to fix there. The instrument
    // reproduced the bug it was built to measure; the fixture caught it only because the matches
    // were read, not because the kind fired.
    re: /\b(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:[A-Za-z][\w-]*\s+){0,2}(agents?|workflows?|teams?|files?|steps?|commands?|skills?|modules?|contracts?|streams?|guides?|entries|entry|backups?|checks?|gates?|rules?|stories)\b/gi,
    note: 'A count asserted about this repository, tolerating up to two qualifiers before the noun.',
  },
  {
    kind: 'version',
    zone: 'any',
    // A concrete version the reader is asked to believe.
    re: /(?:^|[\s@(`'"v>=^~])(\d+\.\d+\.\d+(?:-[\w.]+)?)\b/g,
    note: 'A concrete semver asserted about this package, a module, or a dependency.',
  },
  {
    kind: 'version',
    zone: 'any',
    // `1.4.x` / `v1.7.x` appear throughout UPDATE-GUIDE.md as migration ranges.
    re: /(?:^|[\s@(`'"v>=^~])(\d+\.\d+\.x)\b/g,
    note: 'A version range of the 1.4.x form, used for migration boundaries.',
  },
  {
    kind: 'version',
    zone: 'any',
    // TWO-PART versions: `2.x`, `v6.3`, `4.0`. Closed at T160 because the RESIDUAL ALARM surfaced
    // them — version-shaped tokens that no pattern claimed and no rejector named — which is
    // the mechanism working as designed: the gap announced itself rather than being found by a
    // sixth reading of the pattern set. Before this, `docs/host-framework-sync-playbook.md`
    // reported ZERO versions for a document whose entire subject is upstream version alignment.
    //
    // Ordered AFTER the three-part patterns so `1.4.0` is claimed as a three-part version first;
    // `scan` keeps one assertion per (kind, line, column), so the overlap resolves to one.
    re: /(?:^|[\s@(`'"v>=^~])(\d+\.(?:\d+|x))(?![.\d])/g,
    note: 'A two-part version or range (2.x, v6.3, 4.0). Three-part forms are claimed above.',
  },
];

/**
 * Inline code spans on a line, as [start, end) index pairs.
 *
 * The inverse of `stripInlineCode` in `lib/shipped-links.js`, sharing its CommonMark rule: a span
 * closes on a backtick run of EQUAL length, and an opening run with no equal-length partner is
 * literal text rather than an unterminated span. Treating it as unterminated would swallow the
 * rest of the line.
 *
 * @param {string} line
 * @returns {Array<[number, number]>} span ranges, delimiters included
 */
function codeSpans(line) {
  const spans = [];
  const chars = line.split('');
  let i = 0;
  while (i < chars.length) {
    if (chars[i] !== '`') { i++; continue; }
    const open = i;
    while (i < chars.length && chars[i] === '`') i++;
    const runLen = i - open;
    let j = i;
    let closeStart = -1;
    while (j < chars.length) {
      if (chars[j] !== '`') { j++; continue; }
      const s = j;
      while (j < chars.length && chars[j] === '`') j++;
      if (j - s === runLen) { closeStart = s; break; }
    }
    if (closeStart === -1) continue; // literal backticks; scanning resumes after the run
    spans.push([open, closeStart + runLen]);
    i = closeStart + runLen;
  }
  return spans;
}

/** Markdown link targets on a line, as [start, end) index pairs over the target text. */
function linkTargets(line) {
  const out = [];
  const re = /\]\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    const start = m.index + m[0].indexOf('(') + 1;
    out.push([start, start + m[1].length]);
  }
  return out;
}

const inAny = (ranges, idx) => ranges.some(([a, b]) => idx >= a && idx < b);

/**
 * Reject matches the kind's definition excludes. Returning false is how AC1's "does not count"
 * column is implemented; each rejection names the clause it serves.
 */
/** Box-drawing characters mark a directory DIAGRAM, not instructions to open a path. */
const TREE_RE = /[\u2500-\u257F]/;

function accept(kind, text, line, inDiagram = false) {
  if (kind === 'path') {
    // A node in a directory tree is a label, not a path the reader opens — AC1's excluded case,
    // "a bare word that happens to contain a slash", drawn with box characters. One such diagram
    // in `docs/BMAD-METHOD-COMPATIBILITY.md` supplied a large share of that file's path
    // assertions. No ratio is quoted: two earlier attempts at one were wrong, and the share moves
    // whenever the pattern set does. Re-derive by removing the suppression and diffing.
    // Found by review, not by a test.
    if (inDiagram || TREE_RE.test(line)) return false;
    // AC1's "a URL" exclusion is STRUCTURAL, not a filter here: the path patterns require an
    // opening delimiter and `:` is neither a delimiter nor a path character, so a match can never
    // begin at a scheme. Explicit `SCHEME_RE` / `//` tests once sat here and were deleted after a
    // mutation proved them unreachable — removing them changed no result. The property they were
    // meant to hold is pinned instead by `a URL cannot even become a path CANDIDATE`, which
    // asserts the regex layer directly and fires if `:` is ever added to the character class.
    //
    // This one IS reachable: `4.0.2/foo` is a legal path shape made entirely of path characters.
    if (/^\d+\.\d+/.test(text)) return false;
    return true;
  }
  if (kind === 'command' && text.startsWith('convoke-')) {
    // A `convoke-*` token is an invocation only if it is a shipped binary. The package itself is
    // `convoke-agents`, which appears in prose as a rename target, not as something to run.
    return binNames().has(text);
  }
  if (kind === 'version') {
    // A percentage is not a version. `92.91% coverage` and `83.4% line coverage` began matching
    // when the two-part pattern landed at T160 — an over-count the change introduced and did not
    // record until review found it.
    if (new RegExp(`${text.replace('.', '\\.')}\\s*%`).test(line)) return false;
    return true;
  }
  if (kind === 'count') {
    // "Version numbers (their own kind)" — a digit run that is part of a dotted version is not a
    // count, even when a counted noun follows it.
    if (new RegExp(`\\d+\\.\\d+[\\d.x]*\\s*${text.split(/\s+/)[0]}\\b`).test(line)) return false;
    return true;
  }
  return true;
}

/**
 * Scan a document's lines and return every assertion found.
 *
 * Fence DELIMITER lines are skipped; fence BODIES are scanned (AC1's ruling). A line inside a
 * fence is entirely a code zone.
 *
 * @param {string} content
 * @returns {Array<{kind: string, line: number, col: number, text: string}>}
 */
function scan(content) {
  const lines = content.split('\n');
  const found = [];
  const seen = new Set();
  let fence = null;

  // Which lines belong to a fenced block that is a DIAGRAM. Decided per BLOCK, not per line: a
  // tree's root (`your-project/`) carries no box-drawing character of its own, so a line-local
  // test lets the root through while rejecting its children. Found by a test written for the
  // line-local version, which is the only reason it is not still in.
  const diagramLines = new Set();
  {
    let f = null;
    let start = -1;
    let hasTree = false;
    lines.forEach((line, i) => {
      const m = FENCE_RE.exec(line);
      if (f) {
        if (m && m[2][0] === f.char && m[2].length >= f.len && m[3].trim() === '') {
          if (hasTree) for (let k = start + 1; k < i; k++) diagramLines.add(k);
          f = null;
          return;
        }
        if (TREE_RE.test(line)) hasTree = true;
      } else if (m && m[2].length >= 3) {
        f = { char: m[2][0], len: m[2].length };
        start = i;
        hasTree = false;
      }
    });
  }

  lines.forEach((line, i) => {
    const m = FENCE_RE.exec(line);
    if (fence) {
      if (m && m[2][0] === fence.char && m[2].length >= fence.len && m[3].trim() === '') {
        fence = null;
        return; // closing delimiter: not content
      }
    } else if (m && m[2].length >= 3) {
      fence = { char: m[2][0], len: m[2].length };
      return; // opening delimiter: not content
    }

    const inFence = fence !== null;
    const spans = inFence ? [[0, line.length]] : codeSpans(line);
    const targets = inFence ? [] : linkTargets(line);

    for (const p of PATTERNS) {
      p.re.lastIndex = 0;
      let mm;
      while ((mm = p.re.exec(line)) !== null) {
        const text = mm[1];
        if (!text) continue;
        const col = mm.index + mm[0].indexOf(text);
        const isCode = inAny(spans, col) || inAny(targets, col);
        if (p.zone === 'code' && !isCode) continue;
        if (p.zone === 'prose' && isCode) continue;
        if (!accept(p.kind, text, line, diagramLines.has(i))) continue;
        // One assertion per (kind, line, column).
        const key = `${p.kind}:${i + 1}:${col}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ kind: p.kind, line: i + 1, col, text, end: col + text.length });
      }
    }
  });

  // Collapse same-kind matches that overlap on a line: `npx convoke-install-vortex` fires both the
  // tool-invocation pattern and the convoke-* binary pattern, at different columns, so the column
  // key alone does not dedupe it. One invocation is one assertion. The widest match wins, being
  // the whole instruction rather than a token inside it.
  const byWidth = [...found].sort((a, b) => (b.end - b.col) - (a.end - a.col));
  const kept = [];
  for (const a of byWidth) {
    const covered = kept.some(
      (k) => k.kind === a.kind && k.line === a.line && a.col >= k.col && a.end <= k.end
    );
    if (!covered) kept.push(a);
  }
  kept.sort((a, b) => a.line - b.line || a.col - b.col);
  // `end` was only needed for the containment test above; it is not part of the reported shape.
  return kept.map((a) => ({ kind: a.kind, line: a.line, col: a.col, text: a.text }));
}

/**
 * Candidate extraction, and the named rules that discard a candidate.
 *
 * WHY THIS EXISTS. The pattern set above is a set of NARROW MATCHERS, so anything it does not match
 * is invisible, and invisibility produces an undercount that nothing detects. Two review rounds
 * found class after class this way — several, then more AFTER those were fixed — and the
 * hand-derivation written to catch exactly this shared the patterns' blind spot, because the same
 * person wrote both.
 *
 * So the bias is inverted here. A token in an assertion position is a CANDIDATE by default, and it
 * leaves the candidate pool by exactly one of two routes:
 *   1. a PATTERN classifies it — it becomes a counted assertion; or
 *   2. a REJECTOR discards it — BY NAME, and the name is reportable.
 * Anything on neither route is RESIDUAL, and the residual is printed.
 *
 * A non-zero residual is not a failure; it is the honest statement that the pattern set does not
 * span its input. What it removes is *silence*: a tenth missed class now announces itself instead
 * of shrinking a number nobody can check. `T160` owns the residual's contents.
 */

/** A token in an assertion position: inside code, inside a link target, or a number in prose. */
function candidates(content) {
  const lines = content.split('\n');
  const out = [];
  let fence = null;
  lines.forEach((line, i) => {
    const m = FENCE_RE.exec(line);
    if (fence) {
      if (m && m[2][0] === fence.char && m[2].length >= fence.len && m[3].trim() === '') {
        fence = null;
        return;
      }
    } else if (m && m[2].length >= 3) {
      fence = { char: m[2][0], len: m[2].length };
      return;
    }
    const spans = fence ? [[0, line.length]] : codeSpans(line).map(([a, b]) => [a + 1, b - 1]);
    const zones = fence ? spans : [...spans, ...linkTargets(line)];
    for (const [a, b] of zones) {
      for (const mm of line.slice(a, b).matchAll(/[^\s`|,;()[\]]+/g)) {
        out.push({ line: i + 1, col: a + mm.index, text: mm[0] });
      }
    }
    if (!fence) {
      // Anchored on a NON-word character, not `\b`. `\b` cannot match between `v` and `2`, so
      // `v2.4.x` never became a candidate while its fragment `4.x` did — the alarm reported a
      // phantom shard of a version `scan` had already counted, and missed the version itself.
      // That phantom is part of what justified closing the two-part class at T160, so the
      // discovery story was partly a false alarm. Recorded rather than quietly repaired.
      // The `v` is consumed OUTSIDE the capture so a candidate starts at the same column the
      // classifier reports. Capturing it produced `v6.3` at one column and `6.3` at the next,
      // so the same version appeared as both a counted assertion and an unclassified candidate.
      for (const mm of line.matchAll(/(?:^|[^\w.])v?(\d[\d.x]*)/g)) {
        const col = mm.index + mm[0].indexOf(mm[1]);
        if (!codeSpans(line).some(([x, y]) => col >= x && col < y)) {
          out.push({ line: i + 1, col, text: mm[1] });
        }
      }
    }
  });

  // THE GUARANTEE, MADE BY CONSTRUCTION. Everything `scan` claims is a candidate, whether or not
  // the broad extraction above happened to find it. Without this the pool was merely a THIRD
  // narrow extractor with its own blind spots — assertions the script itself counted sat outside it,
  // which makes "a token in an assertion position is a candidate by default" false, and the
  // residual's arithmetic meaningless. Review found this; no test did, so one now pins it.
  const seen = new Set(out.map((c) => `${c.line}:${c.col}`));
  for (const a of scan(content)) {
    const key = `${a.line}:${a.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ line: a.line, col: a.col, text: a.text });
    }
  }
  out.sort((a, b) => a.line - b.line || a.col - b.col);
  return out;
}

/**
 * Named reasons a candidate is NOT an assertion. Each carries the clause it serves, because a
 * rejection with no name is the same silence this whole mechanism exists to remove.
 */
const REJECTORS = [
  { name: 'markup', note: 'punctuation or markdown syntax, not a token a reader acts on',
    test: (t) => /^[^\w]+$/.test(t) },
  { name: 'cli-flag', note: 'a flag belongs to the invocation already counted as a command',
    test: (t) => /^--?[A-Za-z]/.test(t) },
  { name: 'shell-token', note: 'a shell variable or quoted fragment, not a repository object',
    test: (t) => /^["'$]/.test(t) },
  { name: 'url', note: 'AC1 excludes URLs from the Path kind',
    test: (t) => /^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith('//') },
  { name: 'prose-word', note: 'an ordinary word inside a code span or fence — prose, not an object',
    test: (t) => /^[A-Za-z][A-Za-z-]*$/.test(t) },
  { name: 'bare-number', note: 'a number with no repository noun is not a count claim (AC1)',
    test: (t, line) => /^\d+$/.test(t) && !new RegExp(`${t}\\s*%`).test(line || '') },
  { name: 'list-marker', note: 'markdown ordered-list numbering, not a claim about anything',
    test: (t, line) => /^\d+\.$/.test(t) && new RegExp(`^\\s*${t.replace('.', '\\.')}\\s`).test(line || '') },
  { name: 'percentage', note: 'a coverage or share figure is not a version or a count of objects',
    test: (t, line) => /^\d+(\.\d+)?$/.test(t) && new RegExp(`${t.replace('.', '\\.')}\\s*%`).test(line || '') },
];

/**
 * Candidates that no pattern classified and no rejector named.
 *
 * @returns {{residual: Array, rejected: object, classified: number, candidates: number}}
 */
function residual(content) {
  const lines = content.split('\n');
  const lineOf = (n) => lines[n - 1] || '';
  const claimed = new Set(scan(content).map((a) => `${a.line}:${a.col}`));
  const all = candidates(content);
  const rejected = {};
  const left = [];
  for (const c of all) {
    if (claimed.has(`${c.line}:${c.col}`)) continue;
    const r = REJECTORS.find((x) => x.test(c.text, lineOf(c.line)));
    if (r) {
      rejected[r.name] = (rejected[r.name] || 0) + 1;
      continue;
    }
    left.push(c);
  }
  return { residual: left, rejected, classified: claimed.size, candidates: all.length };
}

/** Kinds in report order. A kind absent here would be invisible in every total. */
const KINDS = ['command', 'path', 'count', 'version'];

/** Tally a scan by kind. */
function tally(assertions) {
  const out = Object.fromEntries(KINDS.map((k) => [k, 0]));
  for (const a of assertions) out[a.kind] += 1;
  out.total = assertions.length;
  return out;
}

/**
 * Run the pattern set against the fixture and fail if any kind is silent.
 *
 * This is the only thing standing between a silently-broken pattern and three stories sized on
 * its output, so it exits non-zero rather than reporting a number.
 *
 * @returns {{ok: boolean, counts: object, silent: string[]}}
 */
function selfCheck(fixturePath) {
  const content = fs.readFileSync(fixturePath, 'utf8');
  const counts = tally(scan(content));
  const silent = KINDS.filter((k) => counts[k] === 0);

  // PER-PATTERN, not merely per-kind. Checking kinds let a whole pattern be deleted in silence:
  // removing the `1.4.x` version pattern dropped seven assertions from the two examined files
  // while the suite stayed at 31/31 and this check stayed green, because a sibling pattern kept
  // the KIND alive. Every pattern must earn its place on the fixture.
  const dead = [];
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    if (!p.re.test(content)) dead.push(`${p.kind}: ${p.re}`);
    p.re.lastIndex = 0;
  }
  return { ok: silent.length === 0 && dead.length === 0, counts, silent, dead };
}

function main(argv) {
  const root = findProjectRoot(__dirname);
  const args = argv.slice(2);

  if (args[0] === '--self-check') {
    const fixture = path.join(root, 'tests', 'audit', 'fixtures', 'derived-assertions-fixture.md');
    const { ok, counts, silent, dead } = selfCheck(fixture);
    for (const k of KINDS) console.log(`  ${k.padEnd(8)} ${counts[k]}`);
    if (!ok) {
      if (silent.length) console.error(`\nFAILED — no fixture match for kind: ${silent.join(', ')}`);
      if (dead.length) console.error(`\nFAILED — pattern matched nothing:\n  ${dead.join('\n  ')}`);
      console.error('Firing zero times is a broken pattern, not a count of zero.');
      return 1;
    }
    console.log('\nOK — every kind fired on the fixture.');
    return 0;
  }

  if (args.length === 0) {
    console.error('usage: node scripts/audit/derived-assertions.js <file.md> [...]');
    console.error('       node scripts/audit/derived-assertions.js --self-check');
    return 2;
  }

  const json = args.includes('--json');
  const files = args.filter((a) => !a.startsWith('--'));
  const report = {};

  for (const rel of files) {
    const abs = path.isAbsolute(rel) ? rel : path.join(root, rel);
    if (!fs.existsSync(abs)) {
      console.error(`missing: ${rel}`);
      return 2;
    }
    const assertions = scan(fs.readFileSync(abs, 'utf8'));
    report[rel] = { counts: tally(assertions), assertions };
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }

  console.log(`\n${'file'.padEnd(42)}${KINDS.map((k) => k.padStart(9)).join('')}${'floor'.padStart(9)}`);
  console.log('-'.repeat(42 + 9 * (KINDS.length + 1)));
  for (const [rel, { counts }] of Object.entries(report)) {
    console.log(
      rel.padEnd(42) + KINDS.map((k) => String(counts[k]).padStart(9)).join('') + String(counts.total).padStart(9)
    );
  }
  console.log('');

  // The residual is the alarm. A pattern set that does not span its input says so here rather
  // than quietly returning a smaller number.
  let totalResidual = 0;
  const perFile = [];
  for (const rel of files) {
    const abs = path.isAbsolute(rel) ? rel : path.join(root, rel);
    const r = residual(fs.readFileSync(abs, 'utf8'));
    totalResidual += r.residual.length;
    perFile.push([rel, r]);
  }

  if (totalResidual === 0) {
    console.log('  Residual: 0 — every candidate was classified or rejected by a named rule.');
  } else {
    console.log(`  ⚠ UNCLASSIFIED CANDIDATES: ${totalResidual}`);
    console.log('  Tokens in an assertion position that no pattern claimed and no rejector named.');
    console.log('  A non-zero residual is a KNOWN GAP, not a clean run — see backlog T160.');
    if (argv.includes('--residual')) {
      for (const [rel, r] of perFile) {
        if (!r.residual.length) continue;
        console.log(`\n  ${rel}`);
        for (const c of r.residual) console.log(`    :${String(c.line).padEnd(5)} ${c.text}`);
      }
    } else {
      console.log('  Re-run with --residual to list them.');
    }
  }
  console.log('');
  console.log('  Figures above are FLOORS under the pinned pattern set, not counts.');
  console.log('');
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { PATTERNS, KINDS, REJECTORS, candidates, residual, codeSpans, linkTargets, accept, scan, tally, selfCheck, main };
