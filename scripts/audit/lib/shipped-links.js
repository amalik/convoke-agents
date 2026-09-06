'use strict';

/**
 * shipped-links.js — link extraction and resolution for the FR12 assertion (story dist-2.2).
 *
 * WHAT THIS ANSWERS
 * -----------------
 * "Is every documented reference in what I installed pointing at something I have?" Every
 * relative markdown link in every shipped `.md` must resolve to a path that is IN THE PACKAGE,
 * not merely in the repository the package was built from. `files[]` decides what ships;
 * nothing decides whether the prose that ships still makes sense once it has.
 *
 * WHY FENCE HANDLING IS LOAD-BEARING RATHER THAN A NICETY
 * ------------------------------------------------------
 * A format specification necessarily *shows* markdown. A scanner without fence handling will
 * therefore always accuse the documents that document the format, and its findings list will be
 * dominated by the files least likely to be wrong.
 *
 * Deliberately NO absolute counts here. Stories 2.3a/2.3b/2.3c exist to drive the finding count
 * to zero, so any number written into this comment is wrong within three stories, and a
 * maintainer comparing output against a stale note chases phantoms. What is stable is the
 * PROPERTY: the difference between a naive scan and this one is exactly the markdown EXAMPLES
 * that shipped documentation contains. Re-derive both sides with
 * `node scripts/audit/assert-shipped-links.js <packageRoot> <repoRoot>` against a scan with
 * `FENCE_RE`/`stripInlineCode` disabled; the story's Completion Notes record the figures as
 * measured on 2026-09-06, with their date attached.
 *
 * `isFenceLine` is not anchored at `^` for the same reason. The example in
 * `_bmad/bme/_enhance/.../backlog-format-spec.md` opens its fence with two leading spaces
 * because it sits inside a list item. A `^`-anchored matcher does not merely miss that one
 * block: it never sees the fence OPEN, so it reads the closing fence as an opening one and
 * inverts the state for the whole remainder of the file. The first measurement written for
 * this story made exactly that mistake.
 *
 * SCOPE — stated, because a gate whose limits are assumed is a gate that gets over-trusted:
 *   * INLINE links only, `[text](target)`. Reference-style definitions (`[id]: path`) are not
 *     resolved. None ship today; if one is added it is unchecked, and that is a known hole.
 *   * A target containing `)` is truncated at the first `)`, matching `scripts/docs-audit.js`.
 *   * `#fragment` suffixes are stripped before resolution. Anchor TARGETS are not validated —
 *     whether a heading exists is out of scope and deliberately so.
 *   * EXTERNAL absolute URLs are permitted and NOT validated. CR-README-D04 narrows this rather
 *     than closing it: only the SELF-REFERENTIAL subset is resolved (ADR-002 Amendment 1).
 *   * It cannot see a file that shipped code READS AT RUNTIME but that no markdown mentions.
 *     That class belongs to `assert-installed-tree.js` (story dist-2.4, shipped). The two are
 *     siblings, not substitutes: this one sees documented references, that one sees arrivals.
 */

const fs = require('fs');
const path = require('path');

/**
 * Fence openers/closers, deliberately NOT anchored at column 0. See the header.
 *
 * THE INDENT IS UNBOUNDED, AND THAT HAS A COST WORTH NAMING. CommonMark allows at most 3 spaces
 * before a fence; 4 or more makes it an indented CODE BLOCK, whose contents are literal. This
 * pattern accepts any indent, because a fence inside a nested list item is indented by the list's
 * content offset and this scanner does not track list context — bounding at 3 would reintroduce
 * the very miss that AC4 exists to prevent, one nesting level down.
 *
 * The cost is the mirror image: a fence-shaped line inside a 4-space indented code block opens a
 * fence that was never open, and an odd number of them inverts fence state for the rest of the
 * file — the same damage the header attributes to `^`-anchoring, from the other direction.
 * Measured 2026-09-06: zero shipped `.md` files contain a fence-shaped line indented 4+ spaces
 * (`grep -rhE '^ {4,}(\x60\x60\x60|~~~)' --include='*.md'` over the packed tarball → 0), so the
 * trade is currently free. `unterminatedFenceAt` below is the tripwire if that changes: state
 * inversion of this kind almost always leaves a fence open at EOF.
 */
const FENCE_RE = /^(\s*)(`{3,}|~{3,})(.*)$/;

/**
 * A leading blockquote marker, stripped before fence detection AND link extraction.
 *
 * Without this, `> \x60\x60\x60` is not a fence, so every link in a blockquoted example is
 * reported as a finding — the identical false-positive class AC4 exists to prevent, differing
 * only in how the example is marked up. Five shipped files contain blockquoted fences today
 * (measured 2026-09-06); none currently holds a link, which is why the gate was not already
 * accusing them and why this was latent rather than loud.
 *
 * Stripping applies to link extraction too, deliberately: a link inside a blockquote is a real
 * link and must still resolve.
 */
const BLOCKQUOTE_RE = /^[ \t]*(?:>[ \t]?)+/;

/** Anything with a scheme is absolute. `mailto:`, `https:`, `file:` all land here. */
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

/**
 * A link TARGET, found by its `](...)` tail rather than by matching the whole link.
 *
 * Matching `\[[^\]]*\]\(...\)` cannot see both targets in `[![badge](img.png)](page.md)` — the
 * bracket class stops at the inner `]`, the match consumes through `img.png`, and `page.md` is
 * never scanned. Badge-wrapped links are the normal shape of a README header, so that blind
 * spot would be pointed at the most-read file in the package. Anchoring on `](` instead needs
 * no theory about how link text nests.
 */
const TARGET_RE = /\]\(([^)]*)\)/g;

/**
 * Mask inline code spans, preserving line length.
 *
 * CommonMark: a span opens on a backtick run and closes on a run of EQUAL length. An opening
 * run with no equal-length partner is literal text, not an unterminated span — treating it as
 * one would swallow the rest of the line and silently drop every link after it.
 *
 * Length is preserved so a caller can still map a match index back to a column.
 *
 * @param {string} line
 * @returns {string} the line with span content (and its delimiters) replaced by spaces
 */
function stripInlineCode(line) {
  const chars = line.split('');
  let i = 0;
  while (i < chars.length) {
    if (chars[i] !== '`') { i++; continue; }
    let open = i;
    while (i < chars.length && chars[i] === '`') i++;
    const runLen = i - open;

    // Look for a closing run of EXACTLY runLen.
    let j = i;
    let closeStart = -1;
    while (j < chars.length) {
      if (chars[j] !== '`') { j++; continue; }
      const s = j;
      while (j < chars.length && chars[j] === '`') j++;
      if (j - s === runLen) { closeStart = s; break; }
    }
    if (closeStart === -1) continue; // literal backticks; scanning resumes after the run
    for (let k = open; k < closeStart + runLen; k++) chars[k] = ' ';
    i = closeStart + runLen;
  }
  return chars.join('');
}

/**
 * Split a raw link target into a path and a fragment.
 *
 * @param {string} raw
 * @returns {{path: string, fragment: string}} `path` is '' for an anchor-only target
 */
function parseTarget(raw) {
  let t = String(raw == null ? '' : raw).trim();
  // `<...>` FIRST, then the title. These were mutually exclusive when the angle-bracket branch
  // returned early: `<file name.md> "Title"` kept its brackets and could never resolve, so a
  // correct link was reported as a finding.
  const angled = /^<([^>]*)>\s*([\s\S]*)$/.exec(t);
  if (angled) t = angled[1].trim();
  else t = t.replace(/\s+["'(][\s\S]*$/, '').trim(); // `path "title"` / `'title'` / `(title)`

  // Order is `path?query#fragment`. Split the fragment first, then the query off what remains:
  // GitHub appends `?plain=1` / `?raw=1` to blob URLs, and leaving it on the path turned a live
  // file into a finding.
  const hash = t.indexOf('#');
  let p = hash >= 0 ? t.slice(0, hash) : t;
  const fragment = hash >= 0 ? t.slice(hash + 1) : '';
  const q = p.indexOf('?');
  if (q >= 0) p = p.slice(0, q);
  if (p.includes('%')) {
    try { p = decodeURIComponent(p); } catch { /* not percent-encoded; use it verbatim */ }
  }
  return { path: p, fragment };
}

/**
 * Derive the self-referential URL prefix from a package's `repository.url`.
 *
 * DATA, NEVER A LITERAL. `verify-external-identifiers`: a hardcoded `github.com/amalik/...`
 * would keep matching after a rename or a fork, so the checker would go on validating paths
 * against a repository that is no longer this one. Returning `null` for an unparsable url is
 * deliberate — an empty prefix would make EVERY absolute URL self-referential and the gate
 * would start reporting external links as broken.
 *
 * @param {string} repositoryUrl e.g. `git+https://github.com/owner/repo.git`
 * @returns {string|null} e.g. `https://github.com/owner/repo/`
 */
function selfRefPrefix(repositoryUrl) {
  if (!repositoryUrl || typeof repositoryUrl !== 'string') return null;
  let url = repositoryUrl.trim();

  // npm's documented shorthands. Rejecting these made `selfRefPrefix` return null, which the CLI
  // turns into exit 2 — and exit 2 aborts the whole `fresh-install` job. A package declaring its
  // repository in a form npm itself documents must not take the harness down.
  const short = /^(github|gitlab|bitbucket):([^/#?]+)\/([^/#?]+?)(?:\.git)?$/.exec(url);
  if (short) {
    const host = { github: 'github.com', gitlab: 'gitlab.com', bitbucket: 'bitbucket.org' }[short[1]];
    return `https://${host}/${short[2]}/${short[3]}/`;
  }

  // A `#committish` suffix is legal in a git url and is NOT part of the repository path.
  // Left on, it produced a truthy-but-wrong prefix (`https://host/o/r.git#v4.0.1/`) which matches
  // no real URL — so AC5 silently evaluated nothing while the run still reported a clean verdict.
  // Only `null` fails closed at the CLI, so a wrong-but-truthy prefix was the worst outcome here.
  url = url.replace(/#.*$/, '');

  const m = /^(?:git\+)?(?:https?:\/\/|ssh:\/\/git@|git@)([^/:@]+)(?::\d+)?[/:]([^/]+)\/(.+?)(?:\.git)?\/?$/
    .exec(url);
  if (!m) return null;
  const [, host, owner, repo] = m;
  if (!host.includes('.') || !owner || !repo) return null;
  // The repo segment is one path segment and carries no url punctuation. Anything else means the
  // parse went wrong, and a wrong prefix is worse than none.
  if (/[/#?]/.test(repo) || /[#?]/.test(owner)) return null;
  return `https://${host}/${owner}/${repo}/`;
}

/**
 * Normalise an absolute URL for prefix comparison: scheme and `www.` are not identity.
 *
 * `http://github.com/o/r/blob/main/x` and `https://www.github.com/o/r/blob/main/x` both name a
 * file in this repository. Compared verbatim against a prefix that is always `https://<host>/`,
 * both classified as external and went unvalidated — a silent hole in AC5 rather than a finding.
 */
function normalizeUrl(u) {
  return u.replace(/^http:\/\//i, 'https://').replace(/^(https:\/\/)www\./i, '$1');
}

/**
 * Extract every inline link target outside fenced blocks and inline code spans.
 *
 * @param {string} content
 * @returns {{links: Array<{line: number, target: string}>, unterminatedFenceAt: number}}
 *   `unterminatedFenceAt` is the 1-indexed line of a fence still open at EOF, or 0.
 */
function extractLinks(content) {
  const links = [];
  const lines = String(content).split('\n');
  let fence = null; // { char, len }
  let fenceOpenedAt = 0;

  for (let i = 0; i < lines.length; i++) {
    // Blockquote markers are stripped before BOTH fence detection and link extraction, so a
    // blockquoted example is skipped like any other and a blockquoted real link still resolves.
    const line = lines[i].replace(BLOCKQUOTE_RE, '');
    const m = FENCE_RE.exec(line);

    if (fence) {
      // A closing fence is the same character, at least as long, with nothing after it.
      if (m && m[2][0] === fence.char && m[2].length >= fence.len && m[3].trim() === '') fence = null;
      continue; // fence lines and their contents are both skipped
    }
    if (m) {
      const ch = m[2][0];
      // A backtick info string may not contain a backtick (CommonMark); that shape is
      // ordinary prose, not a fence.
      if (!(ch === '`' && m[3].includes('`'))) {
        fence = { char: ch, len: m[2].length };
        fenceOpenedAt = i + 1;
        continue;
      }
    }

    const masked = stripInlineCode(line);
    TARGET_RE.lastIndex = 0;
    let hit;
    while ((hit = TARGET_RE.exec(masked)) !== null) {
      links.push({ line: i + 1, target: hit[1].trim() });
    }
  }
  // A fence still open at EOF means every link after it was skipped. Silence here is the
  // fail-open shape this harness has shipped five variants of: the gate would report a clean
  // file precisely because it stopped reading it. Reported as a finding by the caller.
  return { links, unterminatedFenceAt: fence ? fenceOpenedAt : 0 };
}

/**
 * Decide what a target is and, for the two resolvable kinds, what to resolve.
 *
 * @param {string} target raw target text
 * @param {string|null} prefix from {@link selfRefPrefix}
 * @returns {{kind: 'skip'|'relative'|'selfref', path?: string}}
 */
function classify(target, prefix) {
  const { path: p } = parseTarget(target);
  if (!p) return { kind: 'skip' };            // anchor-only or empty
  if (p.startsWith('//')) return { kind: 'skip' }; // protocol-relative: external

  if (SCHEME_RE.test(p)) {
    if (!prefix) return { kind: 'skip' };
    const np = normalizeUrl(p);
    if (!np.startsWith(normalizeUrl(prefix))) return { kind: 'skip' }; // external, unvalidated
    // Only a file-viewing URL names a path. `/issues`, `/security/advisories/new` and the
    // repository root are repository URLs, not file references, and have nothing to resolve.
    const rest = np.slice(normalizeUrl(prefix).length);
    const blob = /^(?:blob|tree|raw)\/[^/]+\/(.+)$/.exec(rest);
    if (!blob) return { kind: 'skip' };
    return { kind: 'selfref', path: blob[1] };
  }

  // A leading `/` is root-relative in a rendered site but meaningless in a tarball. Resolving
  // it against the package root would invent a convention nothing in this package uses;
  // resolving it against `/` would read the developer's filesystem. Neither is defensible, so
  // it is skipped and named here rather than silently mishandled. None ship today.
  if (p.startsWith('/')) return { kind: 'skip' };

  return { kind: 'relative', path: p };
}

/** Every `.md` under `root`, as paths relative to `root`. Nested `node_modules` excluded. */
function markdownFiles(root) {
  const found = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules') continue; // a dependency's README is not our documentation
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(abs);
      else if (ent.isFile() && ent.name.toLowerCase().endsWith('.md')) found.push(path.relative(root, abs));
    }
  };
  walk(root);
  return found.sort();
}

/**
 * True when `abs` exists inside `root`, matching CASE for every segment.
 *
 * TWO THINGS `fs.existsSync` ALONE GETS WRONG HERE, both of which make the gate lie in the
 * permissive direction — the only direction that matters for a gate.
 *
 * 1. CONTAINMENT. A `../` chain that leaves the package lands in `node_modules/` beside it,
 *    where other packages live. `existsSync` says yes, and a link that left the package is
 *    reported as resolved.
 * 2. CASE. macOS/APFS is case-insensitive, so `[home](Readme.md)` pointing at `README.md`
 *    passes on a maintainer's laptop and 404s for every Linux consumer of the tarball. This
 *    gate exists to catch what breaks on somebody else's machine, so deferring to the
 *    auditor's filesystem defeats its purpose. Each segment is checked against its parent's
 *    directory listing; `dirCache` keeps that to one `readdirSync` per directory.
 *
 * Containment is enforced by the segment walk itself — `..` is never a `readdirSync` entry — with
 * an explicit `segments[0] === '..'` guard kept above it as a statement of intent; see the note
 * there, which records that the guard is redundant rather than pretending it is the mechanism.
 * Either way the comparison is by path SEGMENT, never `rel.startsWith('..')`, which cannot tell
 * the escape `../x` from a shipped file legitimately named `..gitkeep-notes.md`.
 *
 * @param {string} root
 * @param {string} abs
 * @param {Map<string, Set<string>>} dirCache
 */
function resolvesInside(root, abs, dirCache) {
  const rel = path.relative(root, abs);
  if (path.isAbsolute(rel)) return false;
  if (rel === '') return true;
  const segments = rel.split(path.sep);
  // REDUNDANT TODAY, AND SAID SO RATHER THAN IMPLIED. The segment walk below already rejects an
  // escape, because `..` is never returned by `readdirSync`. Mutation-verified 2026-09-06:
  // removing this line alone turns no test red, so it is NOT what enforces containment and must
  // not be described as if it were. It is kept as the explicit statement of intent, so the
  // property does not rest on a readdir implementation detail that a future rewrite of the walk
  // could quietly drop. Compared by SEGMENT, not by `rel.startsWith('..')`, which cannot tell the
  // escape `../x` from a shipped file legitimately named `..gitkeep-notes.md` (that distinction
  // IS load-bearing — mutant M14 turns the `..gitkeep-notes.md` test red).
  if (segments[0] === '..') return false;
  let cur = root;
  for (const seg of segments) {
    let entries = dirCache.get(cur);
    if (!entries) {
      try { entries = new Set(fs.readdirSync(cur)); } catch { return false; }
      dirCache.set(cur, entries);
    }
    if (!entries.has(seg)) return false; // absent, or present only under a different case
    cur = path.join(cur, seg);
  }
  return true;
}

/**
 * Scan an ALREADY-EXTRACTED package for unresolvable documented references.
 *
 * It neither packs nor extracts (AC1): `try-fresh-install.sh` has already packed the working
 * tree and installed that tarball, and interrogating a second artifact would be interrogating a
 * different experiment.
 *
 * @param {object} opts
 * @param {string} opts.packageRoot the extracted package (npm's `node_modules/<name>`)
 * @param {string} opts.repoRoot    the repository, for self-referential URLs (AC5)
 * @param {string} [opts.repositoryUrl] override; otherwise read from the SHIPPED package.json
 * @returns {{findings: Array, mdCount: number, fileCount: number, prefix: string|null, linkCount: number}}
 */
function scanPackage({ packageRoot, repoRoot, repositoryUrl }) {
  let url = repositoryUrl;
  if (url === undefined) {
    // The SHIPPED package.json, not the repo's: the gate describes the artifact.
    const raw = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    url = raw && raw.repository && (typeof raw.repository === 'string' ? raw.repository : raw.repository.url);
  }
  const prefix = selfRefPrefix(url);

  const mdFiles = markdownFiles(packageRoot);
  const findings = [];
  let linkCount = 0;
  // One `readdirSync` per directory, shared across every link. Two caches, because the package
  // and the repository are different trees and a path means a different thing in each.
  const pkgDirs = new Map();
  const repoDirs = new Map();

  for (const rel of mdFiles) {
    const abs = path.join(packageRoot, rel);
    const { links, unterminatedFenceAt } = extractLinks(fs.readFileSync(abs, 'utf8'));
    const dir = path.dirname(abs);

    // Reported, not merely counted. An unterminated fence means every link below it went
    // unread, so a clean verdict for this file is an artefact of not looking.
    if (unterminatedFenceAt) {
      findings.push({
        file: rel, line: unterminatedFenceAt, target: '(code fence)', kind: 'fence',
        reason: 'code fence is never closed — every link after this line went unscanned',
      });
    }

    for (const { line, target } of links) {
      const c = classify(target, prefix);
      if (c.kind === 'skip') continue;
      linkCount++;

      if (c.kind === 'relative') {
        if (!resolvesInside(packageRoot, path.resolve(dir, c.path), pkgDirs)) {
          findings.push({ file: rel, line, target, kind: 'relative', reason: 'target is not in the package' });
        }
        continue;
      }
      // selfref — resolved against the REPOSITORY. A `blob/main/` URL names repository
      // content on the default branch, which is a different set from what ships.
      if (!resolvesInside(repoRoot, path.resolve(repoRoot, c.path), repoDirs)) {
        findings.push({ file: rel, line, target, kind: 'selfref', reason: 'target is not in the repository' });
      }
    }
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.target.localeCompare(b.target));
  return { findings, mdCount: mdFiles.length, prefix, linkCount };
}

module.exports = {
  FENCE_RE,
  BLOCKQUOTE_RE,
  normalizeUrl,
  stripInlineCode,
  parseTarget,
  selfRefPrefix,
  extractLinks,
  classify,
  markdownFiles,
  scanPackage,
};
