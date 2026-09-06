'use strict';

/**
 * Tests for the FR12 shipped-link assertion (story dist-2.2).
 *
 * WHY EACH CASE IS A PAIR
 * -----------------------
 * Every skip rule here — fenced block, inline code span — is a rule that makes the checker
 * report LESS. A test that only asserts "nothing was reported" passes just as well against a
 * checker that reports nothing at all, which is the precise shape `verification-must-be-falsifiable`
 * forbids. So every skip case carries its own negative control: the SAME broken link, in the
 * SAME fixture shape, outside the construct being skipped. If the skip rule is deleted the
 * first assertion goes red; if the whole scanner is gutted the second does.
 *
 * The indented-fence case is not decoration. The first measurement written for this story used
 * a fence matcher anchored at `^`, misread the fence state for the remainder of
 * `backlog-format-spec.md`, and classified a documented markdown EXAMPLE as a real finding —
 * inflating the count. Indented and flush fences are therefore separate tests,
 * so that a `^`-anchored regression kills exactly one of them and names itself.
 *
 * `test-fixture-isolation`: every case builds its own tmp tree under os.tmpdir(). Nothing here
 * reads PACKAGE_ROOT as data.
 */

const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { PACKAGE_ROOT, removeTempDirSync } = require('../helpers');

const {
  stripInlineCode,
  parseTarget,
  selfRefPrefix,
  repositoryIdentity,
  resolvesInside,
  classify,
  scanPackage,
} = require('../../scripts/audit/lib/shipped-links');

const CLI = path.join(PACKAGE_ROOT, 'scripts', 'audit', 'assert-shipped-links.js');

const REPO_URL = 'git+https://github.com/acme/widget.git';

/** Build a throwaway package root. `files` maps relative path -> contents. */
function makePackage(files, { repositoryUrl = REPO_URL } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-links-pkg-'));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'widget', version: '0.0.0', repository: { type: 'git', url: repositoryUrl } }),
  );
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
  return root;
}

/** Build a throwaway repository root holding `paths` as empty files. */
function makeRepo(paths) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-links-repo-'));
  for (const rel of paths) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, '');
  }
  return root;
}

const trash = [];
function tmpPackage(...args) { const r = makePackage(...args); trash.push(r); return r; }
function tmpRepo(...args) { const r = makeRepo(...args); trash.push(r); return r; }

after(() => { for (const d of trash) removeTempDirSync(d); });

/** Findings for one fixture, as `file:line -> target` strings, sorted for stable compare. */
function scan(packageRoot, repoRoot) {
  const res = scanPackage({ packageRoot, repoRoot: repoRoot || packageRoot });
  return res.findings.map(f => `${f.file}:${f.line} ${f.target}`).sort();
}

// ─── stripInlineCode ─────────────────────────────────────────────

describe('stripInlineCode', () => {
  it('masks a single-backtick span and leaves surrounding text intact', () => {
    const out = stripInlineCode('see `[a](gone.md)` and [b](also.md)');
    assert.equal(out.includes('gone.md'), false, 'span content survived masking');
    assert.equal(out.includes('also.md'), true, 'text outside the span was masked too');
  });

  it('preserves line length so link columns are not shifted', () => {
    const line = 'x `abc` y';
    assert.equal(stripInlineCode(line).length, line.length);
  });

  it('closes a double-backtick span only on a matching double run', () => {
    // ``a`b`` is ONE span whose content contains a lone backtick. A naive single-backtick
    // scanner ends the span at the inner tick and leaks the rest of the line.
    const out = stripInlineCode('``a`[x](gone.md)`` tail [y](kept.md)');
    assert.equal(out.includes('gone.md'), false);
    assert.equal(out.includes('kept.md'), true);
  });

  it('leaves an unterminated backtick run as literal text', () => {
    // An odd backtick is not a code span; treating it as one would swallow the rest of
    // the line and silently drop every link after it.
    const out = stripInlineCode('a ` b [x](kept.md)');
    assert.equal(out.includes('kept.md'), true);
  });
});

// ─── parseTarget ─────────────────────────────────────────────────

describe('parseTarget', () => {
  it('splits a #fragment off the path', () => {
    assert.deepEqual(parseTarget('docs/a.md#heading'), { path: 'docs/a.md', fragment: 'heading' });
  });

  it('returns a null path for an anchor-only target', () => {
    assert.equal(parseTarget('#heading').path, '');
  });

  it('strips a quoted title', () => {
    assert.equal(parseTarget('docs/a.md "the title"').path, 'docs/a.md');
  });

  it('strips angle brackets', () => {
    assert.equal(parseTarget('<docs/a b.md>').path, 'docs/a b.md');
  });

  it('strips angle brackets AND a title together', () => {
    // These were mutually exclusive while the angle branch returned early: the brackets stayed
    // on, the path could never resolve, and a correct link became a finding.
    assert.equal(parseTarget('<docs/a b.md> "Title"').path, 'docs/a b.md');
  });

  it('strips a ?query before the path, keeping the fragment split', () => {
    // GitHub appends ?plain=1 / ?raw=1 to blob URLs. Left on, a live file reads as missing.
    assert.deepEqual(parseTarget('docs/a.md?plain=1'), { path: 'docs/a.md', fragment: '' });
    assert.deepEqual(parseTarget('docs/a.md?plain=1#L4'), { path: 'docs/a.md', fragment: 'L4' });
  });
});

// ─── selfRefPrefix ───────────────────────────────────────────────

describe('selfRefPrefix', () => {
  it('derives the blob prefix from a git+https repository url', () => {
    assert.equal(selfRefPrefix('git+https://github.com/acme/widget.git'), 'https://github.com/acme/widget/');
  });

  it('derives the same prefix from an ssh remote', () => {
    assert.equal(selfRefPrefix('git@github.com:acme/widget.git'), 'https://github.com/acme/widget/');
  });

  it('drops a #committish suffix instead of baking it into the prefix', () => {
    // A truthy-but-WRONG prefix is the worst outcome available: only `null` fails closed at the
    // CLI, so `https://github.com/acme/widget.git#v1/` would match no real URL and AC5 would
    // evaluate nothing while the run still printed a clean verdict.
    assert.equal(selfRefPrefix('git+https://github.com/acme/widget.git#v4.0.1'), 'https://github.com/acme/widget/');
  });

  it("accepts npm's documented shorthand forms", () => {
    // Rejecting these returned null -> CLI exit 2 -> ENV_FAIL aborts the whole fresh-install job.
    assert.equal(selfRefPrefix('github:acme/widget'), 'https://github.com/acme/widget/');
    assert.equal(selfRefPrefix('gitlab:acme/widget'), 'https://gitlab.com/acme/widget/');
  });

  it('DROPS a transport port from the identity', () => {
    // Reversed in Round 3, and the reversal is the point. Round 2 kept the port on the reasoning
    // that a self-hosted forge carries one. But an `ssh://` or `git://` port is a TRANSPORT port
    // and has no relation to the web UI a `blob` link is written against, so keeping it made the
    // exact-port comparison reject every https self-referential link — silently disabling AC5 for
    // the whole run while the prefix still looked plausible. Hosts are compared without one.
    assert.equal(selfRefPrefix('ssh://git@host.io:2222/acme/widget.git'), 'https://host.io/acme/widget/');
  });

  it('strips the #committish BEFORE matching a shorthand, not after', () => {
    // Ordered the other way, `github:owner/repo#v1` — a form npm documents — returned null,
    // which the CLI turns into exit 2 and the harness turns into ENV_FAIL for the whole job.
    assert.equal(selfRefPrefix('github:acme/widget#v1'), 'https://github.com/acme/widget/');
  });

  it('accepts git:// and PREFIXED shorthands, and REJECTS the bare owner/repo form', () => {
    assert.equal(selfRefPrefix('git://github.com/acme/widget.git'), 'https://github.com/acme/widget/');
    assert.equal(selfRefPrefix('github:acme/widget'), 'https://github.com/acme/widget/');
    // The bare form was accepted in Round 2 and removed in Round 3. `owner/repo` is not a test
    // for a repository reference — it matches ANY two-segment string, so `../owner-repo` and
    // `not-a-url/at-all` both produced confident identities, and a confident wrong identity
    // PASSES the CLI's fail-closed "no parsable repository.url" guard. AC5 then validated
    // nothing while the run printed a clean verdict. Refusing to guess is the correct direction.
    assert.equal(selfRefPrefix('acme/widget'), null);
  });

  it('returns null for junk that superficially looks like owner/repo', () => {
    for (const junk of ['../owner-repo', './repo', 'not-a-url/at-all', 'git@github.com:22/o/r.git',
      'https://github.com/owner/repo/tree/main/packages/x']) {
      assert.equal(selfRefPrefix(junk), null, junk);
    }
  });

  it('rejects a path that is not exactly owner/repo', () => {
    // Round 2 allowed a multi-segment repo to support GitLab subgroups. Unbounded, that also
    // swallowed `/tree/main/packages/x` into `repo` and yielded a prefix matching nothing. The
    // two cases are indistinguishable from the URL alone, so the gate refuses both. A subgroup
    // repository is a documented limitation, not a silent misparse.
    assert.equal(selfRefPrefix('https://gitlab.com/grp/sub/widget.git'), null);
  });

  it('returns null for a url it cannot parse, rather than a prefix that matches everything', () => {
    // An empty prefix would make EVERY absolute URL self-referential and the checker would
    // start failing on external links. Fail closed at the caller instead.
    assert.equal(selfRefPrefix(''), null);
    assert.equal(selfRefPrefix('not a url'), null);
  });
});

// ─── repositoryIdentity / classify, directly ─────────────────────

describe('repositoryIdentity and classify, exercised directly', () => {
  // Round 2 found these reachable only through fixtures, which is how the host-case hole went
  // uncovered: a function tested only via its caller is tested only where the caller happens
  // to go. Both are exported, so both are tested.

  it('decomposes a repository url into host, owner and repo — and nothing else', () => {
    assert.deepEqual(repositoryIdentity('git+https://github.com/acme/widget.git'),
      { host: 'github.com', owner: 'acme', repo: 'widget' });
    assert.deepEqual(repositoryIdentity('ssh://git@host.io:2222/acme/widget.git'),
      { host: 'host.io', owner: 'acme', repo: 'widget' }, 'transport port is not identity');
    assert.deepEqual(repositoryIdentity('git@github.com:acme/widget.git'),
      { host: 'github.com', owner: 'acme', repo: 'widget' });
  });

  it('returns null rather than a partial identity for junk', () => {
    for (const bad of ['', 'not a url', 'https://github.com/onlyowner']) {
      assert.equal(repositoryIdentity(bad), null, bad || '(empty)');
    }
  });

  const ID = { host: 'github.com', port: '', owner: 'acme', repo: 'widget' };

  it('classifies the kinds it must resolve, and skips the rest', () => {
    assert.deepEqual(classify('docs/a.md', ID), { kind: 'relative', path: 'docs/a.md' });
    assert.deepEqual(classify('https://github.com/acme/widget/blob/main/docs/a.md', ID),
      { kind: 'selfref', path: 'docs/a.md' });
    for (const skip of [
      '#anchor-only',
      'mailto:a@b.c',
      'https://example.com/x.md',                        // external
      'https://github.com/acme/widget/issues/new/choose', // repo URL, not a file reference
      'https://github.com/acme/widget',                   // repository root
      '//cdn.example.com/x.md',                           // protocol-relative
      '/root-relative.md',                                // meaningless in a tarball
      '',
    ]) {
      assert.equal(classify(skip, ID).kind, 'skip', skip || '(empty)');
    }
  });

  it('skips every absolute URL when the identity is unknown', () => {
    // Fail-closed direction: no identity must mean "do not validate", never "match everything".
    assert.equal(classify('https://github.com/acme/widget/blob/main/docs/a.md', null).kind, 'skip');
  });

  it('decodes a percent-encoded path segment in a self-referential URL', () => {
    assert.deepEqual(classify('https://github.com/acme/widget/blob/main/docs/a%20b.md', ID),
      { kind: 'selfref', path: 'docs/a b.md' });
  });
});

// ─── Fenced blocks (AC4) ─────────────────────────────────────────

describe('fenced code blocks are skipped', () => {
  it('skips a flush fence — and reports the same link outside one', () => {
    const fenced = tmpPackage({ 'a.md': '```\n[x](nowhere.md)\n```\n' });
    assert.deepEqual(scan(fenced), [], 'a link inside a flush fence was reported');

    const bare = tmpPackage({ 'a.md': '\n[x](nowhere.md)\n\n' });
    assert.deepEqual(scan(bare), ['a.md:2 nowhere.md'], 'negative control: the link is detectable at all');
  });

  it('skips an INDENTED fence — and reports the same link outside one', () => {
    // Two leading spaces, the shape in backlog-format-spec.md:227 that a `^`-anchored
    // fence matcher misreads. The whole naive-vs-fence-aware discrepancy is this case.
    // No absolute counts here on purpose: 2.3a/b/c drive them to zero. Regenerate with
    // `node scripts/audit/assert-shipped-links.js <packageRoot> <repoRoot> --json`.
    const fenced = tmpPackage({ 'a.md': 'text\n\n  ```\n  [x](nowhere.md)\n  ```\n' });
    assert.deepEqual(scan(fenced), [], 'a link inside an indented fence was reported');

    const bare = tmpPackage({ 'a.md': 'text\n\n  [x](nowhere.md)\n' });
    assert.deepEqual(scan(bare), ['a.md:3 nowhere.md'], 'negative control');
  });

  it('resumes scanning after an indented fence closes', () => {
    // The real damage of a `^`-anchored matcher is not the example it lets through; it is
    // that fence state stays OPEN for the rest of the file, so every later link vanishes.
    const pkg = tmpPackage({ 'a.md': '  ```\n  [a](in-fence.md)\n  ```\n\n[b](after.md)\n' });
    assert.deepEqual(scan(pkg), ['a.md:5 after.md']);
  });

  it('treats a tilde fence as a fence', () => {
    const pkg = tmpPackage({ 'a.md': '~~~\n[x](nowhere.md)\n~~~\n' });
    assert.deepEqual(scan(pkg), []);
  });

  it('does not let a tilde run close a backtick fence', () => {
    const pkg = tmpPackage({ 'a.md': '```\n~~~\n[x](nowhere.md)\n```\n' });
    assert.deepEqual(scan(pkg), []);
  });

  it('does not let a shorter run close a longer fence', () => {
    const pkg = tmpPackage({ 'a.md': '````\n```\n[x](nowhere.md)\n````\n' });
    assert.deepEqual(scan(pkg), []);
  });
});

// ─── Inline code spans (AC4) ─────────────────────────────────────

describe('inline code spans are skipped', () => {
  it('skips a link inside a code span — and reports the same link outside one', () => {
    const spanned = tmpPackage({ 'a.md': 'write `[x](nowhere.md)` like so\n' });
    assert.deepEqual(scan(spanned), [], 'a link inside a code span was reported');

    const bare = tmpPackage({ 'a.md': 'write [x](nowhere.md) like so\n' });
    assert.deepEqual(scan(bare), ['a.md:1 nowhere.md'], 'negative control');
  });
});

// ─── Relative resolution (AC3) ───────────────────────────────────

describe('relative links resolve inside the package', () => {
  it('reports a link whose target did not ship', () => {
    const pkg = tmpPackage({ 'docs/a.md': '[x](./missing.md)\n' });
    assert.deepEqual(scan(pkg), ['docs/a.md:1 ./missing.md']);
  });

  it('accepts a link whose target did ship', () => {
    const pkg = tmpPackage({ 'docs/a.md': '[x](./b.md)\n', 'docs/b.md': '' });
    assert.deepEqual(scan(pkg), []);
  });

  it('resolves ../ against the linking file, not the package root', () => {
    const pkg = tmpPackage({ 'docs/a.md': '[x](../top.md)\n', 'top.md': '' });
    assert.deepEqual(scan(pkg), []);
  });

  it('strips a #fragment before resolving, and does not validate the fragment', () => {
    const pkg = tmpPackage({ 'a.md': '[x](b.md#no-such-heading)\n', 'b.md': '# Something Else\n' });
    assert.deepEqual(scan(pkg), [], 'anchor targets are out of scope (AC3)');
  });

  it('reports a fragment link whose FILE is missing', () => {
    const pkg = tmpPackage({ 'a.md': '[x](b.md#h)\n' });
    assert.deepEqual(scan(pkg), ['a.md:1 b.md#h']);
  });

  it('accepts a link to a directory that shipped', () => {
    const pkg = tmpPackage({ 'a.md': '[x](sub/)\n', 'sub/keep.md': '' });
    assert.deepEqual(scan(pkg), []);
  });

  it('skips anchor-only and mailto targets', () => {
    const pkg = tmpPackage({ 'a.md': '[x](#top) [y](mailto:a@b.c)\n' });
    assert.deepEqual(scan(pkg), []);
  });

  it('scans image targets, which are links too', () => {
    const pkg = tmpPackage({ 'a.md': '![alt](img/missing.png)\n' });
    assert.deepEqual(scan(pkg), ['a.md:1 img/missing.png']);
  });

  it('reports a ../ chain that escapes the package, even when it resolves on disk', () => {
    // The dangerous direction. `<packageRoot>/../<something>` lands in node_modules beside
    // this package, where OTHER packages live — so a bare existsSync would call a link that
    // left the package "resolved" and the gate would be quietly false-negative on the one
    // class it exists for. `resolvesInside` is what makes it a finding.
    const outer = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-links-outer-'));
    trash.push(outer);
    fs.writeFileSync(path.join(outer, 'neighbour.md'), '');
    const inner = path.join(outer, 'pkg');
    fs.mkdirSync(inner);
    fs.writeFileSync(path.join(inner, 'package.json'), JSON.stringify({ name: 'w', version: '0.0.0', repository: { url: REPO_URL } }));
    fs.writeFileSync(path.join(inner, 'a.md'), '[x](../neighbour.md)\n');

    assert.equal(fs.existsSync(path.join(inner, '..', 'neighbour.md')), true, 'precondition: the target really is on disk');
    assert.deepEqual(scan(inner), ['a.md:1 ../neighbour.md']);
  });

  it('consults the directory listing rather than deferring to the filesystem', () => {
    // THE CASE-EXACTNESS TEST BELOW CANNOT FAIL ON CI. Every runner is ubuntu-latest, whose
    // filesystem is case-sensitive, so `existsSync` alone already returns false and the test
    // passes for the ordinary reason — Round 2's point. This one is falsifiable everywhere:
    // it asserts the mechanism, by giving `resolvesInside` a poisoned directory cache. If the
    // implementation stops consulting the listing, this goes red on Linux and on macOS alike.
    const pkg = tmpPackage({ 'a.md': '[x](b.md)\n', 'b.md': '' });
    const poisoned = new Map([[pkg, new Set([])]]); // listing claims the directory is empty
    assert.equal(resolvesInside(pkg, path.join(pkg, 'b.md'), poisoned), 'missing',
      'resolution ignored the directory listing and went straight to the filesystem');
    assert.equal(resolvesInside(pkg, path.join(pkg, 'b.md'), new Map()), 'ok',
      'negative control: with a real listing the same path resolves');
  });

  it('does not accept a case-only mismatch', () => {
    // macOS/APFS is case-insensitive, so `existsSync` says yes and the link 404s for every Linux
    // consumer of the tarball. A gate that defers to the auditor's filesystem cannot report what
    // breaks on somebody else's. On a case-SENSITIVE filesystem this passes for the ordinary
    // reason, so the case holds either way.
    const pkg = tmpPackage({ 'a.md': '[home](Readme.md)\n', 'README.md': '' });
    assert.deepEqual(scan(pkg), ['a.md:1 Readme.md']);
  });

  it('rejects a path that leaves the package through a SYMLINKED directory', (t) => {
    // A lexical containment check cannot see this: readdirSync follows the link, and
    // path.resolve normalises `..` textually, so `sub/secret.md` walks cleanly while the file
    // is outside the package. Round 2 demonstrated it against the previous implementation.
    const outer = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-links-sym-'));
    trash.push(outer);
    fs.mkdirSync(path.join(outer, 'outside'));
    fs.writeFileSync(path.join(outer, 'outside', 'secret.md'), '');
    const inner = path.join(outer, 'pkg');
    fs.mkdirSync(inner);
    fs.writeFileSync(path.join(inner, 'package.json'), JSON.stringify({ name: 'w', version: '0.0.0', repository: { url: REPO_URL } }));
    fs.writeFileSync(path.join(inner, 'a.md'), '[x](sub/secret.md)\n');
    try {
      fs.symlinkSync(path.join(outer, 'outside'), path.join(inner, 'sub'), 'dir');
    } catch {
      // A bare `return` here reported green on any platform that refuses symlinks, with nothing
      // distinguishing "verified" from "never ran" — silence reading as coverage, which is the
      // class this suite's header exists to prevent. `t.skip` says so out loud.
      t.skip('this filesystem or platform does not support symlinks');
      return;
    }
    assert.equal(fs.existsSync(path.join(inner, 'sub', 'secret.md')), true, 'precondition: it resolves on disk');
    assert.deepEqual(scan(inner), ['a.md:1 sub/secret.md']);
  });

  it('accepts a shipped file whose name merely begins with dots', () => {
    // The containment test must compare path SEGMENTS: `rel.startsWith('..')` cannot tell the
    // escape `../x` from a real filename like `..gitkeep-notes.md`.
    const pkg = tmpPackage({ 'a.md': '[x](..gitkeep-notes.md)\n', '..gitkeep-notes.md': '' });
    assert.deepEqual(scan(pkg), []);
  });

  it('scans BOTH targets of a badge-wrapped link', () => {
    // `[![badge](img.png)](page.md)` is the normal shape of a README header. A scanner
    // matching whole links (`\[[^\]]*\]\(...\)`) stops at the inner `]`, consumes through
    // img.png and never sees page.md — a blind spot pointed at the most-read file shipped.
    const pkg = tmpPackage({ 'a.md': '[![badge](img.png)](page.md)\n' });
    assert.deepEqual(scan(pkg), ['a.md:1 img.png', 'a.md:1 page.md']);
  });

  it('does not descend into a nested node_modules', () => {
    // A dependency's own README is not this package's documentation, and npm puts
    // dependencies under the installed package root when they cannot be hoisted.
    const pkg = tmpPackage({ 'a.md': '', 'node_modules/dep/README.md': '[x](nowhere.md)\n' });
    assert.deepEqual(scan(pkg), []);
  });
});

// ─── Self-referential absolute URLs (AC5) ────────────────────────

describe('self-referential absolute URLs (ADR-002 Amendment 1)', () => {
  it('accepts a blob/main URL whose path exists in the repository', () => {
    const pkg = tmpPackage({ 'a.md': '[x](https://github.com/acme/widget/blob/main/docs/live.md)\n' });
    const repo = tmpRepo(['docs/live.md']);
    assert.deepEqual(scan(pkg, repo), []);
  });

  it('reports a blob/main URL whose path does NOT exist in the repository', () => {
    const pkg = tmpPackage({ 'a.md': '[x](https://github.com/acme/widget/blob/main/docs/gone.md)\n' });
    const repo = tmpRepo(['docs/live.md']);
    assert.deepEqual(scan(pkg, repo), ['a.md:1 https://github.com/acme/widget/blob/main/docs/gone.md']);
  });

  it('resolves against the REPOSITORY, not the package', () => {
    // The path is present in the package and absent from the repo. A checker resolving
    // self-referential URLs against the package would call this clean.
    const pkg = tmpPackage({ 'a.md': '[x](https://github.com/acme/widget/blob/main/docs/live.md)\n', 'docs/live.md': '' });
    const repo = tmpRepo(['other.md']);
    assert.equal(scan(pkg, repo).length, 1);
  });

  it('does not validate an external absolute URL', () => {
    const pkg = tmpPackage({ 'a.md': '[x](https://example.com/whatever.md)\n' });
    assert.deepEqual(scan(pkg, tmpRepo([])), []);
  });

  it('does not validate a non-blob URL on the same repository', () => {
    // /issues and /security/advisories/new are repository URLs but not file references.
    const pkg = tmpPackage({ 'a.md': '[x](https://github.com/acme/widget/issues/new/choose)\n' });
    assert.deepEqual(scan(pkg, tmpRepo([])), []);
  });

  it('matches the host case-insensitively, as URL semantics require', () => {
    // Hosts are case-insensitive. Compared as strings against a lowercased prefix, an
    // uppercase host classified as external and AC5 evaluated nothing for it.
    const url = 'https://GitHub.com/acme/widget/blob/main/docs/gone.md';
    const pkg = tmpPackage({ 'a.md': `[x](${url})\n` });
    assert.deepEqual(scan(pkg, tmpRepo(['docs/live.md'])), [`a.md:1 ${url}`]);
  });

  it('matches owner and repo case-insensitively, but the PATH case-sensitively', () => {
    // GitHub/GitLab/Bitbucket treat owner and repo case-insensitively; a path inside a git
    // repository is case-sensitive, so the two halves must not be folded the same way.
    //
    // THE OWNER/REPO CASE IS ASSERTED WITH A *MISSING* TARGET, DELIBERATELY. An earlier version
    // used a target that exists and asserted "no finding" — which a checker that SKIPPED the URL
    // produces just as well as one that validated it. Mutation proved it: folding owner/repo
    // case-sensitively survived the suite, because skip and pass are the same observation. For a
    // validator, only a finding that APPEARS demonstrates the link was looked at.
    const mixedCase = 'https://github.com/Acme/Widget/blob/main/docs/gone.md';
    assert.deepEqual(scan(tmpPackage({ 'a.md': `[x](${mixedCase})\n` }), tmpRepo(['docs/live.md'])),
      [`a.md:1 ${mixedCase}`], 'a mixed-case owner/repo must still be VALIDATED, not skipped');

    const resolves = 'https://github.com/Acme/Widget/blob/main/docs/live.md';
    assert.deepEqual(scan(tmpPackage({ 'a.md': `[x](${resolves})\n` }), tmpRepo(['docs/live.md'])), [],
      'and when it resolves, it passes');

    const wrongPathCase = 'https://github.com/acme/widget/blob/main/docs/LIVE.md';
    assert.deepEqual(scan(tmpPackage({ 'a.md': `[x](${wrongPathCase})\n` }), tmpRepo(['docs/live.md'])),
      [`a.md:1 ${wrongPathCase}`], 'the PATH is case-sensitive');
  });

  it('resolves the file-viewing layout of each supported forge', () => {
    // A table, because Round 3 found GitLab and Bitbucket links silently unvalidated while the
    // code advertised all three forges — and `selfReferentialPath` was reachable only through
    // fixtures, which is exactly how that stayed invisible. Each case uses a MISSING target, so
    // a skip and a pass are distinguishable.
    const cases = [
      ['https://github.com/acme/widget.git', 'https://github.com/acme/widget/blob/main/docs/gone.md'],
      ['https://gitlab.com/acme/widget.git', 'https://gitlab.com/acme/widget/-/blob/main/docs/gone.md'],
      ['https://bitbucket.org/acme/widget.git', 'https://bitbucket.org/acme/widget/src/main/docs/gone.md'],
    ];
    for (const [repositoryUrl, url] of cases) {
      const pkg = tmpPackage({ 'a.md': `[x](${url})\n` }, { repositoryUrl });
      assert.deepEqual(scan(pkg, tmpRepo(['docs/live.md'])), [`a.md:1 ${url}`], url);
    }
  });

  it('validates the http:// and www. variants of the same repository', () => {
    // Both name a file in this repository. Compared verbatim against a prefix that is always
    // `https://<host>/`, both classified as external and went silently unvalidated.
    for (const url of [
      'http://github.com/acme/widget/blob/main/docs/gone.md',
      'https://www.github.com/acme/widget/blob/main/docs/gone.md',
    ]) {
      const pkg = tmpPackage({ 'a.md': `[x](${url})\n` });
      assert.deepEqual(scan(pkg, tmpRepo(['docs/live.md'])), [`a.md:1 ${url}`], url);
    }
  });

  it('takes the prefix from package.json, not from a hardcoded host', () => {
    // `verify-external-identifiers`: the owner/repo is data, and a different package must
    // make the SAME url external.
    const pkg = tmpPackage(
      { 'a.md': '[x](https://github.com/acme/widget/blob/main/docs/gone.md)\n' },
      { repositoryUrl: 'git+https://github.com/someone-else/other.git' },
    );
    assert.deepEqual(scan(pkg, tmpRepo([])), [], 'a foreign repo URL must not be validated');
  });
});

// ─── Blockquoted constructs: a DOCUMENTED limit, pinned ──────────

describe('blockquoted fences are a known, documented limit', () => {
  it('reports a link inside a blockquoted fence — pinning the scope limit, not endorsing it', () => {
    // Handling this was attempted in Round 1 and REVERTED: tracking blockquote state without
    // tracking block structure produced two fail-open defects worse than this false positive —
    // a fence opened inside a quote stayed open across ordinary prose and swallowed real links,
    // and a quoted line inside a real fence closed it early. This test exists so the limit is
    // visible and cannot regress silently; if a real CommonMark parser ever lands, it SHOULD go
    // red, and the correct response is to invert it.
    const pkg = tmpPackage({ 'a.md': '> ```\n> [x](nowhere.md)\n> ```\n' });
    assert.deepEqual(scan(pkg), ['a.md:2 nowhere.md']);
  });

  it('resolves a real link inside a blockquote', () => {
    const pkg = tmpPackage({ 'a.md': '> see [x](missing.md)\n' });
    assert.deepEqual(scan(pkg), ['a.md:1 missing.md']);
  });

  it('fails CLOSED, not open, when a blockquoted fence unbalances the file', () => {
    // The reverted fix turned this shape into a silent fail-OPEN: `> ```` opened a fence that
    // stayed open across ordinary prose, `one.md` vanished, and `unterminatedFenceAt` stayed 0
    // because a later fence rebalanced the count. Narrow-and-honest behaves differently: `>` is
    // not a fence, so `one.md` is found; the later lone fence leaves the file unbalanced; and
    // the tripwire reports it. `two.md` is still unscanned — but the run SAYS SO rather than
    // reporting a clean file. That distinction is the whole point of the tripwire.
    const pkg = tmpPackage({ 'a.md': '> ```\n[a](one.md)\n```\n[b](two.md)\n' });
    assert.deepEqual(scan(pkg), ['a.md:2 one.md', 'a.md:3 (code fence)']);
  });
});

// ─── Unterminated fence (fail-open tripwire) ─────────────────────

describe('an unterminated fence is a finding, not silence', () => {
  it('reports the opening line and does not report a clean file', () => {
    // Every link below an unclosed fence goes unread. Reporting nothing would be a clean
    // verdict produced by not looking.
    const pkg = tmpPackage({ 'a.md': '# Doc\n\n```\n\n[broken](totally-missing.md)\n', 'b.md': '[y](a.md)\n' });
    const out = scan(pkg);
    assert.equal(out.length, 1);
    assert.match(out[0], /^a\.md:3 \(code fence\)$/);
  });

  it('reports nothing when the same fence is closed', () => {
    // Negative control: the finding must come from the fence being OPEN, not from its presence.
    const pkg = tmpPackage({ 'a.md': '# Doc\n\n```\n\n[broken](totally-missing.md)\n```\n', 'b.md': '[y](a.md)\n' });
    assert.deepEqual(scan(pkg), []);
  });
});

// ─── CLI contract ────────────────────────────────────────────────

describe('assert-shipped-links.js CLI', () => {
  function run(args) {
    try {
      const stdout = execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
      return { status: 0, stdout };
    } catch (err) {
      return { status: err.status, stdout: String(err.stdout || ''), stderr: String(err.stderr || '') };
    }
  }

  it('exits 0 and prints a census when every link resolves', () => {
    const pkg = tmpPackage({ 'a.md': '[x](b.md)\n', 'b.md': '' });
    const r = run([pkg, tmpRepo([])]);
    assert.equal(r.status, 0);
    // Both files are markdown — `b.md` is the target AND part of the scanned corpus.
    assert.match(r.stdout, /scanned 2 markdown file\(s\), 1 resolvable reference\(s\)/);
  });

  it('exits 1 and names file and line for a finding', () => {
    const pkg = tmpPackage({ 'docs/a.md': 'x\n[x](missing.md)\n' });
    const r = run([pkg, tmpRepo([])]);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /docs\/a\.md:2/);
    assert.match(r.stdout, /missing\.md/);
  });

  it('exits 2 — never 0, never 1 — when the package root does not exist', () => {
    // 1 is the caller's value for "findings were printed". A cannot-run condition reported
    // as 1 is a false defect report; reported as 0 it is a gate that passed by crashing.
    const r = run([path.join(os.tmpdir(), 'convoke-links-absent-' + Date.now()), os.tmpdir()]);
    assert.equal(r.status, 2);
  });

  it('exits 2 when the package declares no parsable repository url', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-links-norepo-'));
    trash.push(root);
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'w', version: '0.0.0' }));
    fs.writeFileSync(path.join(root, 'a.md'), '[x](https://github.com/acme/widget/blob/main/gone.md)\n');
    const r = run([root, os.tmpdir()]);
    assert.equal(r.status, 2, 'AC5 cannot be evaluated without the prefix; silently skipping it is a vacuous gate');
  });

  it('exits 2 when markdown was found but NOTHING was extracted from it', () => {
    // The guard that was missing. One unclosed fence previously produced
    // `scanned 2 markdown file(s), 0 resolvable reference(s)` and exit 0 — a clean verdict from
    // a check that inspected nothing.
    const pkg = tmpPackage({ 'a.md': 'no links here\n', 'b.md': 'nor here\n' });
    const r = run([pkg, tmpRepo([])]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /ZERO resolvable references/);
  });

  it('prints a gathered finding rather than exiting 2, when zero links were resolvable', () => {
    // Round 2 HIGH. The unterminated-fence tripwire produces a finding AND zero resolvable
    // links, so an unqualified zero-extraction guard swallowed the very evidence Round 1 added.
    const pkg = tmpPackage({ 'README.md': '# T\n\n```\nnot closed\n' });
    const r = run([pkg, tmpRepo([])]);
    assert.equal(r.status, 1, 'a gathered finding must outrank the cannot-run guard');
    assert.match(r.stdout, /README\.md:3 -> \(code fence\)/);
  });

  it('emits gathered findings, not a bare exit 2, when the repository url is unparsable', () => {
    // Round 3 HIGH. The `!prefix` guard sat after the scan and was unqualified, so a package with
    // real broken links and a malformed `repository.url` printed NOTHING and exited 2 — which the
    // harness turns into an advisory line, so the run reported nothing at all. Round 2 fixed the
    // sibling guard only; every post-scan bail-out now routes through one function.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-links-badrepo-'));
    trash.push(root);
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'w', version: '0.0.0', repository: { url: 'not a url' } }));
    fs.writeFileSync(path.join(root, 'a.md'), '[a](gone1.md)\n[b](gone2.md)\n');
    const r = run([root, os.tmpdir()]);
    assert.equal(r.status, 1, 'findings must outrank the cannot-run guard');
    assert.match(r.stdout, /gone1\.md/);
    assert.match(r.stdout, /gone2\.md/);
    assert.match(r.stdout, /scan was also incomplete/, 'and the incompleteness must still be reported');
  });

  it('--json emits a parseable payload carrying the evidence split', () => {
    // `--json` is what makes the review record's numbers regenerable rather than transcribed, and
    // Round 3 found it with zero tests — its only occurrence in this suite was inside a comment.
    const pkg = tmpPackage({ 'a.md': '[x](b.md)\n[y](gone.md)\n[z](https://example.com/e.md)\n', 'b.md': '' });
    const r = run([pkg, tmpRepo([]), '--json']);
    assert.equal(r.status, 1);
    const d = JSON.parse(r.stdout);
    assert.equal(d.findingCount, 1);
    assert.equal(d.relativeCount, 2);
    assert.equal(d.selfRefCount, 0);
    assert.equal(d.skippedCount, 1, 'the external URL is skipped');
    assert.equal(d.mdCount, 2);
    assert.equal(d.findings[0].target, 'gone.md');
  });

  it('--json stays parseable on a cannot-run path', () => {
    // A consumer piping to `jq` must get a machine-readable error, not "unexpected end of input".
    const pkg = tmpPackage({ 'a.md': 'only [external](https://example.com/x) links\n' });
    const r = run([pkg, tmpRepo([]), '--json']);
    assert.equal(r.status, 2);
    assert.match(JSON.parse(r.stdout).error, /ZERO resolvable references/);
  });

  it('rejects an unrecognised option instead of silently running in text mode', () => {
    // `--jsno` previously ran in text mode and exited 0/1, so a caller expecting JSON got a parse
    // error rather than a verdict. A typo belongs on the cannot-run side of the contract.
    const pkg = tmpPackage({ 'a.md': '[x](b.md)\n', 'b.md': '' });
    const r = run([pkg, tmpRepo([]), '--jsno']);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /unrecognised option/);
  });

  it('exits 2 with no arguments', () => {
    assert.equal(run([]).status, 2);
  });
});
