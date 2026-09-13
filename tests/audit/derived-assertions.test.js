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
  candidates,
  residual,
  REJECTORS,
  main,
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

  it('the fixture yields EXACTLY these counts — so a deleted pattern fails', () => {
    // `> 0` and the per-pattern `dead` check both catch a pattern that stops MATCHING; neither
    // catches one that is REMOVED, because a sibling keeps the kind alive and `dead` only walks
    // the patterns that still exist. Deleting the `N.N.x` entry left 53/53 green and `--self-check`
    // green while the two examined files lost seven assertions. These totals are fixture-guaranteed
    // (`derive-counts-from-source` permits that) and move the moment the pattern set does.
    const { counts } = selfCheck(FIXTURE);
    assert.deepEqual(
      { command: counts.command, path: counts.path, count: counts.count, version: counts.version },
      { command: 6, path: 8, count: 3, version: 8 },
      'the fixture totals changed — a pattern was added or removed; update this only deliberately'
    );
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

describe('derived-assertions — the residual alarm (T160)', () => {
  // THE POINT OF THE MECHANISM. Nine classes were missed across two review rounds because an
  // unmatched token was invisible. A candidate now leaves the pool only by being classified or by
  // being rejected BY NAME; anything else is residual and is reported. This test is the property
  // itself: an assertion shape nobody anticipated must SURFACE, not vanish.
  it('surfaces an unanticipated assertion shape instead of dropping it', () => {
    // A shape drawn from the LIVE residual, not invented: a template placeholder. An earlier
    // version of this test used `@scope/pkg#v2-beta`, which the path pattern already claims
    // because it contains a slash — the test failed on its own precondition, which is the
    // precondition earning its place.
    const novel = 'The `{backup-dir}` placeholder expands at runtime.';
    assert.equal(scan(novel).length, 0, 'precondition: no pattern classifies this shape');
    const r = residual(novel);
    assert.ok(
      r.residual.some((c) => c.text.includes('{backup-dir}')),
      'an unclassified token in an assertion position must appear in the residual'
    );
  });

  it('a classified token does not also appear in the residual', () => {
    const r = residual('Run `npm test` now.');
    assert.ok(scan('Run `npm test` now.').some((a) => a.kind === 'command'));
    assert.ok(!r.residual.some((c) => c.text === 'npm'), 'a claimed token must leave the pool');
  });

  it('every rejector carries a name and the clause it serves', () => {
    // A rejection with no name is the same silence the mechanism exists to remove.
    for (const r of REJECTORS) {
      assert.ok(r.name && /^[a-z-]+$/.test(r.name), `rejector name is unusable: ${r.name}`);
      assert.ok(r.note && r.note.length > 15, `rejector ${r.name} has no stated reason`);
      assert.equal(typeof r.test, 'function');
    }
  });

  it('rejects by name rather than silently, and reports the tally', () => {
    const r = residual('Run `npm install --dry-run` now.');
    assert.ok(r.rejected['cli-flag'] >= 1, '--dry-run must be rejected as a flag, by name');
    assert.ok(!r.residual.some((c) => c.text === '--dry-run'));
  });

  it('candidates cover fence bodies, code spans and link targets alike', () => {
    const md = ['See [guide](docs/faq.md) and `docs/agents.md`.', '', '```bash', 'npm run build', '```'].join('\n');
    const texts = candidates(md).map((c) => c.text);
    assert.ok(texts.includes('docs/faq.md'), 'link target missing from candidates');
    assert.ok(texts.includes('docs/agents.md'), 'code span missing from candidates');
    assert.ok(texts.includes('npm'), 'fence body missing from candidates');
  });

  it('the residual shrinks when a class is closed — T160 closed two-part versions', () => {
    // The alarm surfaced `2.x` / `v6.3`; closing that class must move it OUT of the residual and
    // INTO the count. Both halves are asserted, so a pattern that merely silences the alarm fails.
    const md = 'A project on 2.x stays on 2.x; upstream BMAD v6.3 is the baseline.';
    const versions = scan(md).filter((a) => a.kind === 'version').map((a) => a.text);
    assert.ok(versions.includes('2.x'), 'two-part version must now be classified');
    assert.ok(versions.includes('6.3'), 'a vN.N form must be classified');
    assert.ok(!residual(md).residual.some((c) => /^v?\d+\.\dx?$/.test(c.text)));
  });

  it('EVERY counted assertion is also a candidate — the mechanism\'s core guarantee', () => {
    // This was FALSE when the alarm shipped: many assertions the script counted were outside the
    // pool, because the prose arm was `\\b\\d…` and `\\b` cannot match between `v` and `2`. The
    // pool was a third narrow extractor with its own blind spots, which makes the residual's
    // arithmetic meaningless. It now holds by construction; this asserts it rather than trusting.
    const docs = [
      fs.readFileSync(FIXTURE, 'utf8'),
      'Upgrading from v2.4.x to v3.0.0 is supported.',
      'Use all seven Vortex agents, or all four Gyre agents.',
      'Run convoke-doctor to verify, or `npm test` first.',
      ['```bash', 'npx -p convoke-agents convoke-update', '```'].join('\n'),
    ];
    for (const doc of docs) {
      const pool = new Set(candidates(doc).map((c) => `${c.line}:${c.col}`));
      for (const a of scan(doc)) {
        assert.ok(pool.has(`${a.line}:${a.col}`),
          `counted ${a.kind} ${JSON.stringify(a.text)} is not in the candidate pool`);
      }
    }
  });

  it('does not emit a FRAGMENT of a version it already counts', () => {
    // `v2.4.x` used to yield the candidate `4.x` — a shard of an assertion already counted — and
    // those phantoms were part of what justified closing the two-part class. The alarm must not
    // manufacture its own evidence.
    const md = 'Upgrading from v2.4.x to v3.0.0 is supported.';
    const junk = residual(md).residual.filter((c) => /^\d+\.[\dx]$/.test(c.text));
    assert.deepEqual(junk, [], 'a version fragment must not appear as an unclassified candidate');
  });

  it('the CLI actually reports the residual — the alarm has a visible surface', () => {
    // Deleting the reporting block left every gate green: lint, the whole suite, docs:audit and
    // --self-check all passed while the mechanism's ONLY user-visible output was gone.
    const out = [];
    const log = console.log;
    console.log = (...a) => out.push(a.join(' '));
    try {
      main(['node', 'x', 'tests/audit/fixtures/derived-assertions-fixture.md']);
    } finally {
      console.log = log;
    }
    const text = out.join('\n');
    assert.match(text, /FLOOR/, 'the output must say the figures are floors');
    assert.match(text, /UNCLASSIFIED CANDIDATES|Residual: 0/,
      'the residual must be reported, or the alarm is invisible');
  });

  it('a version fragment inside a FILENAME is not a version assertion', () => {
    // This is what the `(?![.\\d])` lookahead actually guards. A test that only checked
    // three-part versions could not see its removal: the width-collapse dedupe absorbs the nested
    // match, so `4.0.2` reads identically with or without it. Dropping the lookahead silently
    // moved one file's floor by nine, with the whole suite green.
    const md = 'See `adr/adr-bmad-coupling-v4.0.md` for the ruling.';
    assert.deepEqual(scan(md).filter((a) => a.kind === 'version').map((a) => a.text), []);
  });

  it('a percentage is not a version', () => {
    // Introduced by the two-part pattern at T160 and caught at review, not by a test.
    assert.deepEqual(scan('convoke-update.js (92.91% coverage)').filter((a) => a.kind === 'version'), []);
    assert.deepEqual(scan('83.4% line coverage').filter((a) => a.kind === 'version'), []);
    // and a real version on the same axis still counts
    assert.deepEqual(scan('A project on 2.x stays there.').filter((a) => a.kind === 'version').map((a) => a.text), ['2.x']);
  });

  it('the prose arm surfaces a version NO pattern claims — its only unique contribution', () => {
    // An earlier version of this test used a version the patterns DO claim, so the superset union
    // re-added it and deleting the whole prose arm changed nothing the test could see: it passed
    // for the wrong reason. What the arm uniquely buys is residual entries — assertions the
    // classifiers miss. `migrations-to-1.5.0` is real: the version pattern's delimiter class has
    // no `-`, so the version is uncounted, and only the prose arm makes it visible.
    const md = '| migrations-to-1.5.0 | 6 | migration metadata |';
    assert.deepEqual(
      scan(md).filter((a) => a.kind === 'version').map((a) => a.text), [],
      'precondition: no pattern claims this version'
    );
    assert.ok(
      residual(md).residual.some((c) => c.text === '1.5.0'),
      'a version the classifiers miss must reach the residual, or the alarm is blind'
    );
  });

  it('markdown list numbering is rejected by name, not left as residual noise', () => {
    // Most of the prose arm's residual entries were `1.` `2.` `3.` from ordered lists — noise the
    // alarm correctly surfaced and that had no named reason to leave the pool.
    const md = ['1. First step', '2. Second step'].join('\n');
    const r = residual(md);
    assert.ok(r.rejected['list-marker'] >= 2, 'list numbering must leave by a named rule');
    assert.deepEqual(r.residual.filter((c) => /^\d+\.$/.test(c.text)), []);
  });

  it('a three-part version is still claimed as one assertion, not two', () => {
    // The two-part pattern could shadow or double-count the three-part one.
    assert.deepEqual(scan('The release is 4.0.2.').filter((a) => a.kind === 'version').map((a) => a.text), ['4.0.2']);
  });
});

describe('derived-assertions — defects found by ROUND 1, not by hand-derivation', () => {
  // The author's two hand-derived windows both matched. Every defect below sits OUTSIDE them,
  // which is the argument for review on top of hand-derivation, not instead of it.

  it('applies the fence ruling to COUNTS, not only to commands', () => {
    // `count` carried zone 'prose' while the file header declared fenced bodies counted. Zero
    // counts were lost on this story's two files and a material number on the files 1.5/1.6 are
    // sized on — so neither the fixture nor hand-derivation could see it.
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
