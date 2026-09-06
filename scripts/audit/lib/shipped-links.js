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
 * that shipped documentation contains.
 *
 * To re-derive the current figure:
 *   node scripts/audit/assert-shipped-links.js <packageRoot> <repoRoot> --json
 * To re-derive the NAIVE side there is no flag — you must edit this file (neutralise `FENCE_RE`
 * and make `stripInlineCode` return its argument) and re-run. Said plainly because an earlier
 * version of this comment gave a command as though a switch existed.
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
 *   * BLOCKQUOTED CONSTRUCTS ARE NOT UNDERSTOOD. `> \x60\x60\x60` does not open a fence here, so links
 *     inside a blockquoted markdown EXAMPLE are reported as findings. This is the AC4
 *     false-positive class, surviving in one specific shape, and it is a DELIBERATE scope limit
 *     rather than an oversight: handling it was attempted and reverted. Tracking blockquote
 *     state without tracking block structure generally produced two worse defects than the one
 *     it fixed — a fence opened inside a quote stayed open across ordinary prose and silently
 *     swallowed real links, and a quoted line inside a real fence closed it early. Both were
 *     fail-open. Zero shipped `.md` files contain a link inside a blockquoted fence today
 *     (measured 2026-09-06: 5 files have blockquoted fences, none holds a link), so the limit
 *     costs nothing now and the honest narrow scanner is preferable to a half-parser.
 *     Closing this properly needs a real CommonMark parser; that is a backlog item, and the
 *     decision point is when story 2.3c makes this gate blocking.
 *   * HTML is not markdown here: a relative `<a href>` or `<img src>` is NOT checked, and a link
 *     inside an `<!-- HTML comment -->` IS reported. Zero shipped files hit either today.
 *   * Inline code spans are matched per LINE, so a span wrapping a newline is not masked.
 *   * A MULTI-SEGMENT GIT REF in a self-referential URL yields a WRONG path, not a skip.
 *     `.../blob/feature/x/docs/a.md` is read as ref `feature`, path `x/docs/a.md`, and reports a
 *     valid link as broken. The split is not recoverable from the URL alone — it needs the
 *     repository's branch list. Zero shipped links use a slashed ref. This bullet exists because
 *     `selfReferentialPath` used to say "see SCOPE" about it while SCOPE said nothing.
 *   * ONLY `<owner>/<repo>` IS ACCEPTED as a repository identity. A GitLab subgroup path is
 *     refused rather than guessed, because from the URL alone it is indistinguishable from a
 *     misparse that swallows trailing segments.
 *   * SYMLINKS ARE HANDLED INCONSISTENTLY, stated rather than left to be discovered. A symlinked
 *     `.md` file is silently dropped from the corpus (`readdirSync` reports it as neither file
 *     nor directory), so its own links are checked by nobody; a link INTO a symlinked directory
 *     is resolved and containment-checked. Zero symlinks ship today.
 *   * A `..` traversing a symlinked directory can still escape: `path.resolve` collapses the
 *     `..` textually before `resolvesInside` ever sees the symlinked component. The realpath
 *     check catches the direct form, not this one.
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
 * trade is currently free.
 *
 * `unterminatedFenceAt` IS ONLY A PARTIAL TRIPWIRE, and an earlier version of this sentence
 * overstated it as covering the case ("state inversion of this kind almost always leaves a fence
 * open at EOF"). It covers an ODD number of stray fence-shaped lines. An EVEN number rebalances
 * the state, so links between them are silently unscanned and `unterminatedFenceAt` stays 0.
 * Demonstrated in review against a document showing the fence delimiter literally twice. The
 * real fix is a CommonMark parser; until then this limit is documented rather than guarded.
 */
const FENCE_RE = /^(\s*)(`{3,}|~{3,})(.*)$/;


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
 * Identify the repository a `repository.url` names, as structured data.
 *
 * NARROWED IN ROUND 3, BY DELETION. Rounds 1-3 each found HIGH defects here and nowhere else in
 * comparable density, and the diagnosis was that this function was doing far more than AC5 asks.
 * AC5 requires one thing: resolve `https://<forge>/<owner>/<repo>/blob/<ref>/<path>` for the
 * package being audited. Round 2 additionally built npm bare shorthands, transport ports and
 * multi-segment repository paths — none specified, none used by this package, and each one a
 * fresh way to return a CONFIDENT WRONG ANSWER. Three examples, all real, all removed:
 *
 *   `../owner-repo`     -> {owner: '..',  repo: 'owner-repo'}   the bare `owner/repo` shorthand
 *   `not-a-url/at-all`  -> {owner: 'not-a-url', repo: 'at-all'} matched ANY two-segment string
 *   `ssh://h:2222/o/r`  -> port 2222, which then made every https link fail the port comparison
 *
 * Each produced a NON-NULL identity, so `assert-shipped-links.js`'s fail-closed
 * "no parsable repository.url" guard passed, and AC5 then silently validated nothing while the
 * run printed a clean verdict. A wrong answer that passes a fail-closed guard is worse than no
 * answer, which is the whole reason that guard exists.
 *
 * What is accepted now, and nothing else:
 *   - a URL with an explicit scheme (`https`, `http`, `git+https`, `git`, `ssh`) whose path is
 *     EXACTLY two segments, `<owner>/<repo>`
 *   - scp syntax `git@host:owner/repo(.git)`, path exactly two segments
 *   - npm's PREFIXED shorthands `github:`/`gitlab:`/`bitbucket:` — the prefix is required,
 *     because it is what distinguishes a repository reference from an arbitrary string
 * Anything else returns null, the CLI exits 2, and the harness reports that it could not run.
 * That is the correct direction for a gate: refuse rather than guess.
 *
 * NO PORT. A transport port on an `ssh://` or `git://` remote has no relation to the web UI a
 * `blob` link is written against, so carrying it into the identity disabled AC5 for the whole
 * run. Hosts are compared without one.
 *
 * @param {string} repositoryUrl
 * @returns {{host: string, owner: string, repo: string}|null} null when not confidently parsable
 */
function repositoryIdentity(repositoryUrl) {
  if (!repositoryUrl || typeof repositoryUrl !== 'string') return null;
  // A `#committish` is legal in a git url and never part of the repository path. Stripped FIRST,
  // before any shape is matched: ordered after the shorthand branch, it made `github:o/r#v1`
  // (a form npm documents) fail to parse at all.
  let url = repositoryUrl.trim().replace(/#.*$/, '');
  if (!url) return null;

  const ok = (host, owner, repo) => {
    // `.` and `..` are path traversal, not repository names, and reached this far as owners.
    const bad = x => !x || x === '.' || x === '..' || x.includes('/');
    if (!host || !host.includes('.') || bad(owner) || bad(repo)) return null;
    return { host: host.toLowerCase().replace(/^www\./, ''), owner, repo };
  };

  const HOSTS = { github: 'github.com', gitlab: 'gitlab.com', bitbucket: 'bitbucket.org' };
  const short = /^(github|gitlab|bitbucket):([^/:@\s]+)\/([^/:@\s]+?)(?:\.git)?$/.exec(url);
  if (short) return ok(HOSTS[short[1]], short[2], short[3]);

  if (!url.includes('://')) {
    // scp syntax `git@host:owner/repo.git`. `new URL()` cannot parse it.
    const scp = /^(?:git\+)?git@([^:/\s]+):(.+?)(?:\.git)?\/?$/.exec(url);
    if (!scp) return null;
    const parts = scp[2].split('/').filter(Boolean);
    if (parts.length !== 2) return null; // exactly owner/repo; `22/owner/repo` read 22 as the owner
    return ok(scp[1], parts[0], parts[1]);
  }

  try {
    const u = new URL(url.replace(/^git\+/, '').replace(/^(?:git|ssh):\/\//, 'https://'));
    const parts = u.pathname.replace(/\.git$/, '').split('/').filter(Boolean).map(decodeURIComponentSafe);
    // EXACTLY two. Unbounded, this swallowed `/tree/main/packages/x` into `repo` and produced a
    // prefix that matched nothing, disabling AC5 while looking healthy.
    if (parts.length !== 2) return null;
    return ok(u.hostname, parts[0], parts[1]);
  } catch {
    return null;
  }
}

/**
 * The prefix form, kept because the CLI prints it and a reader wants to see what was matched.
 * Derived from {@link repositoryIdentity}, never parsed independently — two parsers disagreeing
 * is how the string-comparison defects survived three rounds.
 *
 * @param {string} repositoryUrl
 * @returns {string|null}
 */
function selfRefPrefix(repositoryUrl) {
  const id = repositoryIdentity(repositoryUrl);
  return id ? `https://${id.host}/${id.owner}/${id.repo}/` : null;
}

/**
 * The file-viewing URL layouts this understands, per forge. Table rather than a regex so that
 * adding a forge is a data change with a test beside it, and so that what is NOT supported is
 * visible. Each entry maps the segments following `<owner>/<repo>/` to the repository path.
 */
const FORGE_LAYOUTS = [
  // GitHub / Gitea / Forgejo:            /<owner>/<repo>/blob/<ref>/<path>
  rest => (['blob', 'tree', 'raw'].includes(rest[0]) ? rest.slice(2) : null),
  // GitLab:                              /<owner>/<repo>/-/blob/<ref>/<path>
  rest => (rest[0] === '-' && ['blob', 'tree', 'raw'].includes(rest[1]) ? rest.slice(3) : null),
  // Bitbucket:                           /<owner>/<repo>/src/<ref>/<path>
  rest => (rest[0] === 'src' ? rest.slice(2) : null),
];

/**
 * Does `target` name a file in the repository `id` describes, and if so which path?
 *
 * Host, owner and repo are compared case-insensitively (URL semantics; and GitHub, GitLab and
 * Bitbucket all treat owner/repo case-insensitively). The PATH is compared case-sensitively,
 * because a path inside a git repository is.
 *
 * @param {string} target an absolute URL
 * @param {{host: string, owner: string, repo: string}} id
 * @returns {string|null} the repository-relative path, or null when this is not a file reference
 */
function selfReferentialPath(target, id) {
  let u;
  try { u = new URL(target); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (u.hostname.replace(/^www\./i, '').toLowerCase() !== id.host) return null;

  const parts = u.pathname.split('/').filter(Boolean).map(decodeURIComponentSafe);
  if (parts.length < 2) return null;
  if (parts[0].toLowerCase() !== id.owner.toLowerCase()) return null;
  if (parts[1].toLowerCase() !== id.repo.toLowerCase()) return null;

  const rest = parts.slice(2);
  for (const layout of FORGE_LAYOUTS) {
    const segs = layout(rest);
    // `segs` may legitimately be an empty array (a link to the ref root); require a real path.
    if (segs && segs.length) return segs.join('/');
  }
  // Not a file-viewing URL: `/issues`, `/security/advisories/new`, the repository root.
  return null;
}

function decodeURIComponentSafe(x) {
  try { return decodeURIComponent(x); } catch { return x; }
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
    const line = lines[i];
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
 * @param {object|null} identity from {@link repositoryIdentity}
 * @returns {{kind: 'skip'|'relative'|'selfref', path?: string}}
 */
function classify(target, identity) {
  const { path: p } = parseTarget(target);
  if (!p) return { kind: 'skip' };            // anchor-only or empty
  if (p.startsWith('//')) return { kind: 'skip' }; // protocol-relative: external

  if (SCHEME_RE.test(p)) {
    if (!identity) return { kind: 'skip' };
    const repoPath = selfReferentialPath(p, identity);
    if (!repoPath) return { kind: 'skip' }; // external, or not a file reference: unvalidated
    return { kind: 'selfref', path: repoPath };
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
 * RETURNS A STATUS, NOT A BOOLEAN, and that is deliberate. A first attempt at the unresolvable
 * case returned the STRING 'unresolvable' from a function every call site tested with `!`, which
 * is truthy — so the error path silently became the PASS path. Three characters, fail-open, in the
 * middle of a review round about fail-open. A three-valued result forces each caller to say what
 * it means; a boolean plus a sentinel does not.
 *
 * @param {string} root
 * @param {string} abs
 * @param {Map<string, Set<string>>} dirCache
 * @returns {'ok'|'missing'|'unresolvable'}
 */
function resolvesInside(root, abs, dirCache) {
  const rel = path.relative(root, abs);
  if (path.isAbsolute(rel)) return 'missing';
  if (rel === '') return 'ok';
  const segments = rel.split(path.sep);
  // REDUNDANT TODAY, AND SAID SO RATHER THAN IMPLIED. The segment walk below already rejects an
  // escape, because `..` is never returned by `readdirSync`. Mutation-verified 2026-09-06:
  // removing this line alone turns no test red, so it is NOT what enforces containment and must
  // not be described as if it were. It is kept as the explicit statement of intent, so the
  // property does not rest on a readdir implementation detail that a future rewrite of the walk
  // could quietly drop. Compared by SEGMENT, not by `rel.startsWith('..')`, which cannot tell the
  // escape `../x` from a shipped file legitimately named `..gitkeep-notes.md`. That distinction
  // IS load-bearing, and the test named 'accepts a shipped file whose name merely begins with
  // dots' is what proves it: swapping this line for `rel.startsWith('..')` turns that test red.
  // (An earlier version cited a numbered mutant here. That number was defined in no artifact in
  // the repository, and the harness that produced it is not committed — a pointer to nothing
  // reads as evidence and is worse than no pointer. Cite the test; it is in the repo.)
  if (segments[0] === '..') return 'missing';
  let cur = root;
  for (const seg of segments) {
    let entries = dirCache.get(cur);
    if (!entries) {
      try { entries = new Set(fs.readdirSync(cur)); } catch { return 'missing'; }
      dirCache.set(cur, entries);
    }
    if (!entries.has(seg)) return 'missing'; // absent, or present only under a different case
    cur = path.join(cur, seg);
  }
  // SYMLINKS DEFEAT A LEXICAL CONTAINMENT CHECK, and Round 2 demonstrated it: a directory inside
  // the package symlinked to somewhere outside it makes `sub/secret.md` walk cleanly, because
  // `readdirSync` follows the link and `path.resolve` only normalises `..` textually. Resolving
  // both sides and re-testing containment is the only check that survives that. Kept AFTER the
  // walk, not instead of it, because `realpathSync` is case-normalising on macOS and would undo
  // the case-exactness the walk exists to enforce.
  try {
    const realRoot = fs.realpathSync(root);
    const realAbs = fs.realpathSync(abs);
    const realRel = path.relative(realRoot, realAbs);
    if (path.isAbsolute(realRel) || realRel.split(path.sep)[0] === '..') return 'missing';
  } catch {
    // It was listed a moment ago. A broken symlink, an EACCES on an intermediate directory or a
    // deletion between the walk and here all land here. Fail closed — but the CALLER must not
    // then report "not in the package", which is a claim this code did not establish; see the
    // `unresolvable` reason at the call site.
    return 'unresolvable';
  }
  return 'ok';
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
 * @returns {{findings: Array, mdCount: number, prefix: string|null, linkCount: number,
 *   relativeCount: number, selfRefCount: number, skippedCount: number, uniqueSelfRefPaths: number}}
 */
function scanPackage({ packageRoot, repoRoot, repositoryUrl }) {
  let url = repositoryUrl;
  if (url === undefined) {
    // The SHIPPED package.json, not the repo's: the gate describes the artifact.
    const raw = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    url = raw && raw.repository && (typeof raw.repository === 'string' ? raw.repository : raw.repository.url);
  }
  const identity = repositoryIdentity(url);
  const prefix = selfRefPrefix(url);

  const mdFiles = markdownFiles(packageRoot);
  const findings = [];
  let linkCount = 0;
  let relativeCount = 0;
  let selfRefCount = 0;
  let skippedCount = 0;
  const selfRefPaths = new Set();
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
      const c = classify(target, identity);
      if (c.kind === 'skip') { skippedCount++; continue; }
      linkCount++;
      if (c.kind === 'relative') relativeCount++;
      else { selfRefCount++; selfRefPaths.add(c.path); }

      if (c.kind === 'relative') {
        const st = resolvesInside(packageRoot, path.resolve(dir, c.path), pkgDirs);
        if (st !== 'ok') {
          findings.push({
            file: rel, line, target, kind: 'relative',
            reason: st === 'unresolvable'
              ? 'target could not be resolved (broken link, permissions, or a race)'
              : 'target is not in the package',
          });
        }
        continue;
      }
      // selfref — resolved against the REPOSITORY. A `blob/main/` URL names repository
      // content on the default branch, which is a different set from what ships.
      const st = resolvesInside(repoRoot, path.resolve(repoRoot, c.path), repoDirs);
      if (st !== 'ok') {
        findings.push({
          file: rel, line, target, kind: 'selfref',
          reason: st === 'unresolvable'
            ? 'target could not be resolved (broken link, permissions, or a race)'
            : 'target is not in the repository',
        });
      }
    }
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.target.localeCompare(b.target));
  return {
    findings, mdCount: mdFiles.length, prefix, linkCount,
    relativeCount, selfRefCount, skippedCount, uniqueSelfRefPaths: selfRefPaths.size,
  };
}

module.exports = {
  FENCE_RE,
  stripInlineCode,
  parseTarget,
  repositoryIdentity,
  selfRefPrefix,
  selfReferentialPath,
  extractLinks,
  classify,
  markdownFiles,
  resolvesInside,
  scanPackage,
};
