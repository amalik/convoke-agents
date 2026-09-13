'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  PATTERNS,
  KINDS,
  codeSpans,
  linkTargets,
  scan,
  tally,
  selfCheck,
} = require('../../scripts/audit/derived-assertions');

const FIXTURE = path.join(__dirname, 'fixtures', 'derived-assertions-fixture.md');

/** Count of one kind in a snippet — the shape most assertions below need. */
const count = (md, kind) => scan(md).filter((a) => a.kind === kind).length;
/** The matched texts of one kind, for assertions about WHAT matched rather than how many. */
const texts = (md, kind) => scan(md).filter((a) => a.kind === kind).map((a) => a.text);

describe('derived-assertions — the fixture demonstration (AC1)', () => {
  it('fires at least once for every kind', () => {
    const { ok, counts, silent } = selfCheck(FIXTURE);
    assert.ok(ok, `silent kinds: ${silent.join(', ')}`);
    for (const k of KINDS) assert.ok(counts[k] > 0, `${k} fired zero times`);
  });

  it('FAILS when a kind is silent — the check can say something else', () => {
    // Without this, "every kind fired" is an unfalsified claim. A fixture with no command in it
    // must make selfCheck report failure, not a count of zero.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'da-'));
    const bare = path.join(tmp, 'no-commands.md');
    try {
      fs.writeFileSync(bare, 'Seven agents exist. Version 4.0.2. See `docs/faq.md`.\n');
      const { ok, silent } = selfCheck(bare);
      assert.equal(ok, false, 'a fixture with no command must fail the self-check');
      assert.deepEqual(silent, ['command']);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('every pattern in the pinned set is global and carries a note', () => {
    // `scan` drives each regex with `lastIndex`; a non-global pattern would match only once per
    // line and undercount silently — the failure mode this whole story guards against.
    for (const p of PATTERNS) {
      assert.ok(p.re.global, `${p.kind} pattern is not global`);
      assert.ok(KINDS.includes(p.kind), `${p.kind} is not a reported kind`);
      assert.ok(p.note && p.note.length > 10, `${p.kind} pattern has no explanatory note`);
      assert.ok(['code', 'prose', 'any'].includes(p.zone), `${p.kind} has an unknown zone`);
    }
  });
});

describe('derived-assertions — fenced blocks are COUNTED (AC1 ruling)', () => {
  const fenced = ['Intro.', '', '```bash', 'npm install convoke-agents', '```', ''].join('\n');

  it('counts a command inside a fence body', () => {
    assert.equal(count(fenced, 'command'), 1);
    assert.deepEqual(texts(fenced, 'command'), ['npm install convoke-agents']);
  });

  it('does not count the fence delimiter lines themselves', () => {
    // The delimiters carry no assertion; counting them would inflate every fenced document.
    const onFence = scan(fenced).filter((a) => a.line === 3 || a.line === 5);
    assert.deepEqual(onFence, []);
  });

  it('a tilde fence is a fence', () => {
    const tilde = ['~~~', 'git status', '~~~'].join('\n');
    assert.equal(count(tilde, 'command'), 1);
  });

  it('an indented fence opener still opens a fence', () => {
    // `FENCE_RE` deliberately permits leading whitespace: a fence inside a list item is indented,
    // and a column-0 anchor would treat its body as prose.
    const indented = ['- step:', '', '  ```bash', '  npm test', '  ```'].join('\n');
    assert.equal(count(indented, 'command'), 1);
  });
});

describe('derived-assertions — defects found by ROUND 1, not by hand-derivation', () => {
  // The author's two hand-derived windows both matched. Every defect below sits OUTSIDE them,
  // which is the argument for review on top of hand-derivation, not instead of it.

  it('applies the fence ruling to COUNTS, not only to commands', () => {
    // `count` carried zone 'prose' while the file header declared fenced bodies counted. Zero
    // counts were lost on this story's two files and nine on the files 1.5/1.6 are sized on —
    // so neither the fixture nor hand-derivation could see it.
    assert.equal(count(['```', '7 agents', '```'].join('\n'), 'count'), 1);
    assert.equal(count('The roster is `7 agents` today.', 'count'), 1);
  });

  it('counts repository nouns beyond the original closed list', () => {
    assert.deepEqual(texts('7 workflows, 4 user guides', 'count'), ['7', '4']);
    assert.deepEqual(texts('Agent manifest updated with 4 new entries', 'count'), ['4']);
    assert.deepEqual(texts('Last 5 backups kept automatically', 'count'), ['5']);
  });

  it('counts a backticked filename with no directory prefix', () => {
    // AC1 defines a Path structurally. An 11-entry allowlist of root files missed every other
    // backticked filename and was a hardcoded inventory that rots on rename.
    assert.deepEqual(texts('Read `agent-registry.js` first.', 'path'), ['agent-registry.js']);
    assert.deepEqual(texts('See `findings.yaml` for absences.', 'path'), ['findings.yaml']);
    assert.deepEqual(texts('Open `hc1-empathy-artifacts.md`.', 'path'), ['hc1-empathy-artifacts.md']);
    assert.deepEqual(texts('[Agents](agents.md)', 'path'), ['agents.md']);
  });

  it('counts a root dotfile, which has no extension to match', () => {
    assert.deepEqual(texts('Check `.gitignore` before committing.', 'path'), ['.gitignore']);
  });

  it('does NOT count nodes of a directory diagram as paths', () => {
    // AC1's excluded case — "a bare word that happens to contain a slash" — drawn with box
    // characters. One such diagram supplied a quarter of Story 1.5's sizing.
    const tree = ['```', 'your-project/', '├── _bmad/', '│   └── bme/', '```'].join('\n');
    assert.equal(count(tree, 'path'), 0);
    // and a real path in ordinary code is unaffected
    assert.deepEqual(texts('See `_bmad/bme/` for modules.', 'path'), ['_bmad/bme/']);
  });

  it('every PATTERN must fire on the fixture, not merely every kind', () => {
    // Deleting the `N.N.x` version pattern dropped seven assertions with the suite at 31/31 and
    // the self-check green, because a sibling pattern kept the KIND alive.
    const { dead } = selfCheck(FIXTURE);
    assert.deepEqual(dead, [], `patterns matching nothing: ${dead.join(', ')}`);
  });

  it('a convoke-* binary is a command outside backticks too', () => {
    // Narrowing the opening-delimiter class to a backtick alone dropped 17 commands from
    // UPDATE-GUIDE.md with the full suite green: every test wrote the binary backticked, so the
    // fence-body invocations the AC1 ruling protects had no coverage at all.
    const fenced = ['```bash', 'npx -p convoke-agents convoke-update', '```'].join('\n');
    assert.ok(texts(fenced, 'command').includes('convoke-update'));
    assert.ok(texts('Run convoke-doctor now.', 'command').includes('convoke-doctor'));
  });

  it('finds every code span on a line, not just the first', () => {
    // `codeSpans` giving up after the first span cost 7 assertions in UPDATE-GUIDE.md, green.
    assert.deepEqual(
      texts('Open `docs/faq.md` and `docs/agents.md` and `docs/testing.md`.', 'path'),
      ['docs/faq.md', 'docs/agents.md', 'docs/testing.md']
    );
  });
});

describe('derived-assertions — AC1 exclusions actually reject', () => {
  it('a bare tool name in prose is not a command', () => {
    assert.equal(count('The npm registry is where this package lives.', 'command'), 0);
    assert.equal(count('We use git for version control.', 'command'), 0);
  });

  it('but the same tool inside code is a command', () => {
    // The zone is the whole discriminator, so it needs a positive case beside the negative.
    assert.equal(count('Run `npm test` first.', 'command'), 1);
  });

  it('a URL is not a repository path', () => {
    assert.equal(count('See `https://example.com/docs/guide` upstream.', 'path'), 0);
    assert.equal(count('See `//cdn.example.com/x/y` upstream.', 'path'), 0);
    assert.equal(count('Mail `mailto:a/b` there.', 'path'), 0);
  });

  it('a URL cannot even become a path CANDIDATE — the exclusion is structural', () => {
    // The test above passed for the wrong reason until this one existed: deleting the explicit
    // scheme filter changed no result, because the regex can never BEGIN a match at a scheme.
    // This asserts that mechanism, so loosening the character class to admit `:` fails here
    // rather than silently letting every URL through as a path.
    const pathRes = PATTERNS.filter((p) => p.kind === 'path').map((p) => p.re);
    for (const line of ['See `https://example.com/a/b` up.', '[x](https://example.com/a/b)']) {
      for (const re of pathRes) {
        re.lastIndex = 0;
        assert.equal(re.exec(line), null, `a path pattern produced a candidate from ${line}`);
      }
    }
  });

  it('a version-shaped string is not a path — and this guard IS reachable', () => {
    // Unlike the scheme case, `4.0.2/foo` is made entirely of path characters, so the regex does
    // hand it to `accept`. Deleting that branch makes this fail.
    assert.equal(count('Pin `4.0.2/foo` there.', 'path'), 0);
  });

  it('a slash in prose is not a repository path', () => {
    assert.equal(count('Choose the agent and/or the workflow.', 'path'), 0);
  });

  it('a version is not a count, even with a counted noun beside it', () => {
    assert.equal(count('Upgrading to 4.0.2 agents-per-team was never a thing.', 'count'), 0);
    // The same sentence still yields the version, so the exclusion is narrow rather than a mute.
    assert.equal(count('Upgrading to 4.0.2 agents-per-team was never a thing.', 'version'), 1);
  });

  it('a package spec is not a binary invocation', () => {
    assert.deepEqual(texts('Pin `convoke-agents@3.3.0` for the old behaviour.', 'command'), []);
  });
});

describe('derived-assertions — the adjacency class (AC6, reproduced here first)', () => {
  // `docs-audit.js` requires the counted noun adjacent to the number, which is why
  // `docs/faq.md:40` can carry two count claims and be flagged for neither. The first version of
  // THIS pattern had the identical defect; these cases pin the fix.
  it('counts a claim with a qualifier between the number and the noun', () => {
    assert.equal(count('The framework ships seven Vortex agents.', 'count'), 1);
    assert.equal(count('There are 4 Gyre agents in the readiness team.', 'count'), 1);
  });

  it('counts BOTH claims when one line carries two', () => {
    const line = 'It ships seven Vortex agents and four Gyre agents.';
    assert.equal(count(line, 'count'), 2, 'a second claim on the same line must not be swallowed');
  });

  it('still counts the plain adjacent form', () => {
    assert.equal(count('Twelve workflows are registered.', 'count'), 1);
  });
});

describe('derived-assertions — defects found by AC2 hand-derivation, not by any test', () => {
  // Both were found by enumerating UPDATE-GUIDE.md:100-121 by hand and diffing against the
  // script. The suite was green throughout. That is the whole argument for AC2's method: the
  // fixture proves a pattern fires AT ALL, hand-derivation proves it fires COMPLETELY.
  it('counts a bare directory path with no trailing filename', () => {
    // `_bmad/` was missed because the pattern demanded a final segment. A silent undercount here
    // makes this story smaller and every downstream story look cheaper.
    assert.deepEqual(texts('The `_bmad/` directory is preserved.', 'path'), ['_bmad/']);
    assert.deepEqual(texts('See `docs/` for guides.', 'path'), ['docs/']);
  });

  it('does not count the package name as a binary invocation', () => {
    // `convoke-agents` is package.json `name`, not a `bin` entry; UPDATE-GUIDE.md writes it in
    // rename notes, which are not instructions to run anything.
    assert.equal(count('Renamed: `bmad-enhanced` → `convoke-agents` (npm package).', 'command'), 0);
  });

  it('still counts a real shipped binary', () => {
    // The negative above must not be achieved by muting the whole pattern.
    assert.deepEqual(texts('Run `convoke-doctor` to verify.', 'command'), ['convoke-doctor']);
    assert.deepEqual(texts('Run `convoke-export` to bundle.', 'command'), ['convoke-export']);
  });

  it('rejects a convoke-* name that is not a shipped binary', () => {
    assert.equal(count('Try `convoke-nonexistent` now.', 'command'), 0);
  });
});

describe('derived-assertions — one invocation is one assertion', () => {
  it('collapses a same-kind match nested inside a wider one', () => {
    // `npx convoke-install-vortex` fires the tool pattern AND the convoke-* pattern at different
    // columns; the column key alone does not dedupe it.
    const md = 'Install with `npx convoke-install-vortex`.';
    assert.deepEqual(texts(md, 'command'), ['npx convoke-install-vortex']);
  });

  it('keeps two genuinely separate commands on one line', () => {
    const md = 'Run `convoke-doctor` then `convoke-version`.';
    assert.equal(count(md, 'command'), 2);
  });

  it('does not truncate an invocation at its first slash', () => {
    const md = ['```bash', 'node scripts/audit/derived-assertions.js --self-check', '```'].join('\n');
    assert.deepEqual(texts(md, 'command'), ['node scripts/audit/derived-assertions.js --self-check']);
  });
});

describe('derived-assertions — code span and link-target detection', () => {
  it('finds spans and respects equal-length backtick runs', () => {
    assert.deepEqual(codeSpans('a `b` c'), [[2, 5]]);
    assert.deepEqual(codeSpans('``a `b` c``'), [[0, 11]]);
  });

  it('treats an unpaired backtick run as literal text, not an open span', () => {
    // Swallowing the rest of the line here would silently drop every later assertion.
    assert.deepEqual(codeSpans('a ` b c'), []);
    // A DOUBLE-backtick run with no equal-length partner is literal; scanning resumes after it,
    // so the single-backtick span that follows is still found.
    assert.equal(count('a `` b and `docs/faq.md` after', 'path'), 1);
    // And the spec's own consequence, which is easy to assert backwards: two single-backtick runs
    // pair with EACH OTHER, so a third token is outside a span rather than inside one. An earlier
    // version of this test asserted the intuitive reading and failed against correct code.
    assert.deepEqual(codeSpans('a ` b and `docs/faq.md` after'), [[2, 11]]);
  });

  it('counts a path written only as a link target', () => {
    assert.deepEqual(linkTargets('see [guide](docs/faq.md) now'), [[12, 23]]);
    assert.deepEqual(texts('see [guide](docs/faq.md) now', 'path'), ['docs/faq.md']);
  });

  it('counts a root-level file that has no directory prefix', () => {
    assert.deepEqual(texts('Open `README.md` first.', 'path'), ['README.md']);
  });
});

describe('derived-assertions — tally', () => {
  it('reports every kind, including the ones that found nothing', () => {
    const t = tally(scan('Nothing assertable here.'));
    for (const k of KINDS) assert.equal(t[k], 0, `${k} missing from the tally`);
    assert.equal(t.total, 0);
  });

  it('total equals the sum of the kinds', () => {
    const t = tally(scan(fs.readFileSync(FIXTURE, 'utf8')));
    assert.equal(t.total, KINDS.reduce((n, k) => n + t[k], 0));
  });
});
