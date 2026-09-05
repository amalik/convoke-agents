'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { removeTempDirSync, initGitFixture } = require('../helpers');

const {
  audit,
  checkShape,
  checkUniqueness,
  checkAgentSources,
  checkRegistryDrift,
  operationalAgents,
  trackedSourcesAt,
  GitUnavailableError,
  frontmatterName,
  isV5AgentFile,
  norm,
  parseArgs,
  main,
  REQUIRED_COLUMNS,
  VALID_STATUSES,
  OPERATIONAL,
} = require('../../scripts/audit/name-registry-integrity.js');

// Fixture-bound tests for the name-registry lint (T124, deliverable 3 of the meta-model
// baseline). Per `test-fixture-isolation`, nothing here reads the live tree: the script's
// job IS the live read, so it lives in `scripts/audit/` and these tests cover its pure
// logic against trees and rows this file constructs and owns.
//
// Assertions are behavioural - "this defect produces this finding id" - never counts
// against the real registry, whose row count changes every time a team is reserved.

const HEADER = [...REQUIRED_COLUMNS, 'notes'];
const IDX = Object.fromEntries(REQUIRED_COLUMNS.map((c) => [c, HEADER.indexOf(c)]));

/** Build a row positionally from the header above, so tests never hardcode cell offsets. */
function row(overrides = {}) {
  const base = {
    kind: 'agent',
    name: 'Emma',
    code: '',
    scope: 'Contextualize',
    tier: 'convoke',
    status: 'shipped',
    declared_in: 'vortex',
    collision: '',
    notes: '',
  };
  const merged = { ...base, ...overrides };
  return HEADER.map((col) => merged[col] ?? '');
}

const ids = (findings) => findings.map((f) => f.id);
const V63 = '---\nname: bmad-bme-agent-emma\n---\n\n# Emma\n';
/** A complete v5 agent file. `display` is the name the agent introduces itself by. */
const v5 = (display, frontmatter = 'discovery empathy expert') =>
  `---\nname: "${frontmatter}"\n---\n\n\`\`\`xml\n<agent id="x" name="${display}">\n` +
  '<activation critical="MANDATORY"></activation>\n<persona></persona>\n</agent>\n```\n';

let tmpDirs = [];

/**
 * A fixture tree plus the tracked-file set the audit would get from `git ls-files`.
 * Passing the set explicitly is what keeps these tests off git and off the live tree;
 * `trackedSourcesAt` is the only part that shells out, and `main()` owns it.
 */
function makeTree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'name-registry-'));
  tmpDirs.push(dir);
  const tracked = new Set();
  for (const f of files) {
    const rel = f.rel;
    fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), f.content, 'utf8');
    if (f.tracked !== false) tracked.add(rel);
  }
  return { dir, tracked };
}

const vortexAgent = (id, content, tracked) => ({
  rel: `_bmad/bme/_vortex/agents/${id}/SKILL.md`,
  content,
  tracked,
});
const gyreAgent = (id, content, tracked) => ({
  rel: `_bmad/bme/_gyre/agents/${id}.md`,
  content,
  tracked,
});

afterEach(() => {
  for (const d of tmpDirs) removeTempDirSync(d);
  tmpDirs = [];
});

describe('norm', () => {
  it('folds case, NFD/NFC form and non-breaking space to one key', () => {
    assert.equal(norm('Emma'), norm('emma'));
    assert.equal(norm('Emma'.normalize('NFD')), norm('Emma'));
    assert.equal(norm('Loom\u00a0Master'), norm('Loom Master'));
  });

  it('survives null and undefined rather than throwing', () => {
    assert.equal(norm(null), '');
    assert.equal(norm(undefined), '');
  });
});

describe('frontmatterName', () => {
  it('reads an unquoted value', () => {
    assert.equal(frontmatterName('---\nname: bmad-bme-agent-emma\n---\n'), 'bmad-bme-agent-emma');
  });

  it('unquotes a quoted value - the style every Gyre agent file uses', () => {
    assert.equal(frontmatterName('---\nname: "stack detective"\n---\n'), 'stack detective');
    assert.equal(frontmatterName("---\nname: 'x'\n---\n"), 'x');
  });

  it('finds a name that sits far past the first 512 bytes', () => {
    const long = '---\ndescription: ' + 'x'.repeat(900) + '\nname: bmad-bme-agent-wade\n---\n';
    assert.equal(frontmatterName(long), 'bmad-bme-agent-wade');
  });

  it('returns null for an empty value instead of capturing the next line', () => {
    assert.equal(frontmatterName('---\nname:\n---\n'), null);
    assert.equal(frontmatterName('---\nname:   \n---\n'), null);
  });

  it('ignores a name: line in the body, outside the frontmatter block', () => {
    assert.equal(frontmatterName('---\ntitle: x\n---\n\nname: not-frontmatter\n'), null);
  });

  it('handles CRLF line endings', () => {
    assert.equal(frontmatterName('---\r\nname: bmad-bme-agent-mila\r\n---\r\n'), 'bmad-bme-agent-mila');
  });

  it('returns null when there is no frontmatter block at all', () => {
    assert.equal(frontmatterName(''), null);
    assert.equal(frontmatterName('# just a heading\n'), null);
  });
});

describe('parseArgs', () => {
  it('rejects a bare --root instead of throwing on undefined', () => {
    assert.match(parseArgs(['node', 's', '--root']).error, /requires a path/);
    assert.match(parseArgs(['node', 's', '--root', '--other']).error, /requires a path/);
  });

  it('rejects a repeated --root instead of silently using the first', () => {
    assert.match(parseArgs(['node', 's', '--root', 'a', '--root', 'b']).error, /more than once/);
  });

  it('rejects an unknown flag and a bare positional instead of auditing the wrong tree', () => {
    assert.match(parseArgs(['node', 's', '--verbose']).error, /unknown argument/);
    assert.match(parseArgs(['node', 's', '/some/path']).error, /unknown argument/);
  });

  it('resolves a valid --root to an absolute path', () => {
    assert.equal(parseArgs(['node', 's', '--root', '.']).projectRoot, path.resolve('.'));
  });
});

describe('main - exit codes', () => {
  it('returns 1 rather than throwing when the argument is malformed', () => {
    assert.equal(main(['node', 's', '--root']), 1);
  });

  it('returns 1 rather than throwing when the tree has no registry', () => {
    const { dir } = makeTree([]);
    assert.equal(main(['node', 's', '--root', dir]), 1);
  });
});

describe('checkShape', () => {
  it('reports every required column that is absent, by name', () => {
    const { headerFindings, idx } = checkShape(['kind', 'name'], []);
    assert.equal(headerFindings.length, REQUIRED_COLUMNS.length - 2);
    assert.equal(idx, null, 'no index is returned when the header cannot be trusted');
  });

  it('rejects a status, kind or tier outside its declared enum', () => {
    assert.ok(ids(checkShape(HEADER, [row({ status: 'wip' })]).rowFindings).includes('row/status'));
    assert.ok(ids(checkShape(HEADER, [row({ kind: 'squad' })]).rowFindings).includes('row/kind'));
    assert.ok(ids(checkShape(HEADER, [row({ tier: 'internal' })]).rowFindings).includes('row/tier'));
  });

  it('accepts every status the enum declares', () => {
    for (const status of VALID_STATUSES) {
      const { rowFindings } = checkShape(HEADER, [row({ kind: 'team', name: 'x', status })]);
      assert.deepEqual(ids(rowFindings), [], `status ${status} should be legal`);
    }
  });

  it('allows a reserved row to be deliberately unnamed, but not any other status', () => {
    const reserved = checkShape(HEADER, [row({ kind: 'team', name: '', status: 'reserved' })]);
    assert.deepEqual(ids(reserved.rowFindings), [], 'reserving a name means not having one yet');

    const proposed = checkShape(HEADER, [row({ kind: 'team', name: '', status: 'proposed' })]);
    assert.ok(ids(proposed.rowFindings).includes('row/unnamed'));
  });

  it('flags a row whose cell count disagrees with the header', () => {
    assert.ok(ids(checkShape(HEADER, [row().slice(0, 3)]).rowFindings).includes('row/arity'));
  });

  it('separates header findings from row findings, so only the header can short-circuit', () => {
    const { headerFindings, rowFindings } = checkShape(HEADER, [row({ tier: 'TYPO' })]);
    assert.deepEqual(headerFindings, []);
    assert.deepEqual(ids(rowFindings), ['row/tier']);
  });
});

describe('checkUniqueness', () => {
  it('flags the same name twice within one kind', () => {
    assert.deepEqual(ids(checkUniqueness([row({ name: 'Emma' }), row({ name: 'Emma' })], IDX)), [
      'unique/duplicate',
    ]);
  });

  it('is case- and Unicode-insensitive, because a collision is not a spelling question', () => {
    assert.deepEqual(ids(checkUniqueness([row({ name: 'Emma' }), row({ name: 'emma' })], IDX)), [
      'unique/duplicate',
    ]);
    const nfd = [row({ name: 'Renée' }), row({ name: 'Renée'.normalize('NFD') })];
    assert.deepEqual(ids(checkUniqueness(nfd, IDX)), ['unique/duplicate']);
  });

  it('flags a duplicated code, the other namespace in the same file', () => {
    const rows = [row({ kind: 'team', name: 'a', code: 'VTX' }), row({ kind: 'team', name: 'b', code: 'VTX' })];
    assert.deepEqual(ids(checkUniqueness(rows, IDX)), ['unique/duplicate-code']);
  });

  it('allows many rows to leave the code blank', () => {
    const rows = [row({ kind: 'team', name: 'a' }), row({ kind: 'team', name: 'b' })];
    assert.deepEqual(ids(checkUniqueness(rows, IDX)), []);
  });

  it('accepts a cross-kind collision only when a row names the colliding name', () => {
    const declared = [
      row({ kind: 'team', name: 'Helm', collision: 'team Helm vs a proposed Conduit agent named Helm' }),
      row({ kind: 'agent', name: 'Helm' }),
    ];
    assert.deepEqual(ids(checkUniqueness(declared, IDX)), []);
  });

  it('rejects collision prose that describes a DIFFERENT name', () => {
    // The defect this replaces: any non-empty text immunised the row, so a name already
    // carrying prose about an unrelated collision was exempt from every future one.
    const rows = [
      row({ kind: 'team', name: 'Helm', collision: 'vs a proposed Conduit agent named Atlas' }),
      row({ kind: 'agent', name: 'Helm' }),
    ];
    assert.deepEqual(ids(checkUniqueness(rows, IDX)), ['unique/undeclared-collision']);
  });

  it('flags a cross-kind reuse where no row declares anything', () => {
    const rows = [row({ kind: 'team', name: 'Loom' }), row({ kind: 'agent', name: 'Loom' })];
    assert.deepEqual(ids(checkUniqueness(rows, IDX)), ['unique/undeclared-collision']);
  });

  it('does not treat blank reserved names as colliding with each other', () => {
    const rows = [
      row({ kind: 'team', name: '', status: 'reserved' }),
      row({ kind: 'team', name: '', status: 'reserved' }),
    ];
    assert.deepEqual(ids(checkUniqueness(rows, IDX)), []);
  });
});

describe('checkRegistryDrift', () => {
  const agents = [{ name: 'Emma', id: 'contextualization-expert', module: 'vortex' }];

  it('flags an agent that ships but has no operational registry row', () => {
    assert.deepEqual(ids(checkRegistryDrift([], IDX, agents)), ['drift/missing-from-registry']);
  });

  it('flags a registry row claiming an agent the operational registry does not carry', () => {
    assert.ok(ids(checkRegistryDrift([row({ name: 'Ghost' })], IDX, agents)).includes('drift/not-operational'));
  });

  it('reports a spelling-only difference once, not as two contradictory findings', () => {
    assert.deepEqual(ids(checkRegistryDrift([row({ name: 'emma' })], IDX, agents)), ['drift/name-spelling']);
  });

  it('treats an invisible-character difference as a spelling difference, not a missing agent', () => {
    const findings = checkRegistryDrift([row({ name: 'Em\u200bma' })], IDX, agents);
    assert.deepEqual(ids(findings), ['drift/name-spelling']);
  });

  it('flags a name carried twice by agent-registry.js, which every Map would hide', () => {
    const dupes = [
      { name: 'Emma', id: 'a', module: 'vortex' },
      { name: 'Emma', id: 'b', module: 'gyre' },
    ];
    assert.ok(ids(checkRegistryDrift([row({ name: 'Emma' })], IDX, dupes)).includes('drift/duplicate-agent-name'));
  });

  it('passes when the two agree, regardless of ordering', () => {
    const two = [
      { name: 'Emma', id: 'contextualization-expert', module: 'vortex' },
      { name: 'Isla', id: 'discovery-empathy-expert', module: 'vortex' },
    ];
    assert.deepEqual(ids(checkRegistryDrift([row({ name: 'Isla' }), row({ name: 'Emma' })], IDX, two)), []);
  });

  it('ignores proposed and reserved rows, which describe things that do not exist yet', () => {
    const rows = [
      row({ name: 'Emma' }),
      row({ kind: 'agent', name: 'Unbuilt', status: 'proposed' }),
      row({ kind: 'agent', name: 'Held', status: 'reserved' }),
    ];
    assert.deepEqual(ids(checkRegistryDrift(rows, IDX, agents)), []);
  });

  it('treats every operational status as requiring a real agent', () => {
    for (const status of OPERATIONAL) {
      const findings = checkRegistryDrift([row({ name: 'Ghost', status })], IDX, agents);
      assert.ok(ids(findings).includes('drift/not-operational'), `status ${status} must demand an agent`);
    }
  });
});

describe('checkAgentSources', () => {
  const emma = [{ name: 'Emma', id: 'contextualization-expert', module: 'vortex' }];
  const scout = [{ name: 'Scout', id: 'stack-detective', module: 'gyre' }];
  const run = (rows, agents, { dir, tracked }) => checkAgentSources(rows, IDX, agents, dir, tracked);

  it('flags an agent row with no source file anywhere', () => {
    assert.deepEqual(ids(run([row({ name: 'Emma' })], emma, makeTree([]))), ['source/untracked']);
  });

  it('flags a source that exists on disk but is UNTRACKED, and says so', () => {
    const tree = makeTree([vortexAgent('contextualization-expert', V63, false)]);
    const findings = run([row({ name: 'Emma' })], emma, tree);
    assert.deepEqual(ids(findings), ['source/untracked']);
    assert.match(findings[0].detail, /exists on disk but is NOT tracked/);
  });

  it('passes a converted agent whose SKILL.md is BMB-canonical', () => {
    const tree = makeTree([vortexAgent('contextualization-expert', V63)]);
    assert.deepEqual(ids(run([row({ name: 'Emma' })], emma, tree)), []);
  });

  it('convention-checks a FLAT .md agent, which the first draft skipped entirely', () => {
    // The regression this exists for: five of twelve live agents are flat, and a flat file
    // was never convention-checked - an empty one passed.
    const tree = makeTree([gyreAgent('stack-detective', '---\nname: nonsense\n---\n')]);
    const findings = run([row({ name: 'Scout', declared_in: 'gyre' })], scout, tree);
    assert.deepEqual(ids(findings), ['convention/not-bmb-canonical']);
  });

  it('fails an EMPTY source file rather than passing it', () => {
    const tree = makeTree([gyreAgent('stack-detective', '')]);
    const findings = run([row({ name: 'Scout', declared_in: 'gyre' })], scout, tree);
    assert.deepEqual(ids(findings), ['convention/no-name']);
  });

  it('NOTES rather than fails an agent still carrying the v5 XML block', () => {
    const tree = makeTree([vortexAgent('contextualization-expert', v5('Emma'))]);
    const findings = run([row({ name: 'Emma' })], emma, tree);
    assert.deepEqual(ids(findings), ['convention/v5-unconverted']);
    assert.equal(findings[0].severity, 'NOTE', 'filed I97 Epic 2 debt must not redden CI');
  });

  it('NOTES a flat v5 agent too - shape is not the discriminator, content is', () => {
    const tree = makeTree([gyreAgent('stack-detective', v5('Scout'))]);
    const findings = run([row({ name: 'Scout', declared_in: 'gyre' })], scout, tree);
    assert.deepEqual(ids(findings), ['convention/v5-unconverted']);
  });

  it('does NOT excuse a converted agent that merely documents the old <agent id= shape', () => {
    const documented = '---\nname: wrong-name\n---\n\nLegacy example:\n\n```\n<agent id="x">\n```\n';
    const tree = makeTree([vortexAgent('contextualization-expert', documented)]);
    const findings = run([row({ name: 'Emma' })], emma, tree);
    assert.deepEqual(ids(findings), ['convention/not-bmb-canonical']);
    assert.equal(findings[0].severity, 'BROKEN', 'prose must not downgrade a real failure to a NOTE');
  });

  it('accepts a canonical name behind a long description, past any fixed byte window', () => {
    const long = '---\ndescription: ' + 'x'.repeat(900) + '\nname: bmad-bme-agent-emma\n---\n';
    const tree = makeTree([vortexAgent('contextualization-expert', long)]);
    assert.deepEqual(ids(run([row({ name: 'Emma' })], emma, tree)), []);
  });

  it('accepts a QUOTED canonical name', () => {
    const quoted = '---\nname: "bmad-bme-agent-emma"\n---\n';
    const tree = makeTree([vortexAgent('contextualization-expert', quoted)]);
    assert.deepEqual(ids(run([row({ name: 'Emma' })], emma, tree)), []);
  });

  it('builds a multi-word canonical name by hyphenating, so Loom Master resolves', () => {
    const agents = [
      { name: 'Loom Master', id: 'team-factory', module: 'loom', submodule: '_team-factory' },
    ];
    const tree = makeTree([
      {
        rel: '_bmad/bme/_team-factory/agents/team-factory.md',
        content: '---\nname: bmad-bme-agent-loom-master\n---\n',
      },
    ]);
    assert.deepEqual(ids(run([row({ name: 'Loom Master', declared_in: 'loom' })], agents, tree)), []);
  });

  it('resolves the directory from the agent-registry submodule field, not a hardcoded map', () => {
    const agents = [
      { name: 'New', id: 'new-agent', module: 'somewhere', team: 'somewhere', submodule: '_elsewhere' },
    ];
    const tree = makeTree([
      { rel: '_bmad/bme/_elsewhere/agents/new-agent.md', content: '---\nname: bmad-bme-agent-new\n---\n' },
    ]);
    assert.deepEqual(ids(run([row({ name: 'New', declared_in: 'somewhere' })], agents, tree)), []);
  });

  it('refuses to guess a team label for a standalone agent that declares none', () => {
    // The team label cannot be derived from the directory - ADR-001 D2 makes module and
    // team different objects - so an unlabelled second standalone agent is reported
    // rather than silently stamped `loom`.
    const agents = [{ name: 'New', id: 'new-agent', module: 'loom', submodule: '_elsewhere' }];
    const findings = run([row({ name: 'New', declared_in: 'loom' })], agents, makeTree([]));
    assert.deepEqual(ids(findings), ['drift/unlabelled-team']);
  });

  it('flags a module it cannot locate instead of guessing a directory', () => {
    const agents = [{ name: 'New', id: 'new-agent', module: 'unmapped' }];
    const findings = run([row({ name: 'New', declared_in: 'unmapped' })], agents, makeTree([]));
    assert.deepEqual(ids(findings), ['source/unknown-module']);
  });

  it('refuses an agent id that is not a single path segment', () => {
    const agents = [{ name: 'Evil', id: '../../escape', module: 'vortex' }];
    const findings = run([row({ name: 'Evil' })], agents, makeTree([]));
    assert.deepEqual(ids(findings), ['source/unsafe-id']);
  });

  it('flags declared_in disagreeing with where the agent actually lives', () => {
    const tree = makeTree([vortexAgent('contextualization-expert', V63)]);
    const findings = run([row({ name: 'Emma', declared_in: 'gyre' })], emma, tree);
    assert.ok(ids(findings).includes('drift/module-mismatch'));
  });

  it('reports an unreadable source instead of dying mid-scan', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'name-registry-'));
    tmpDirs.push(dir);
    const rel = '_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md';
    fs.mkdirSync(path.join(dir, rel), { recursive: true }); // a directory where a file belongs
    const findings = checkAgentSources([row({ name: 'Emma' })], IDX, emma, dir, new Set([rel]));
    assert.deepEqual(ids(findings), ['source/unreadable']);
  });

  it('leaves a drifted row to checkRegistryDrift rather than double-reporting it', () => {
    assert.deepEqual(ids(run([row({ name: 'Ghost' })], [], makeTree([]))), [], 'one defect, one finding');
  });

  it('skips team rows entirely', () => {
    assert.deepEqual(ids(run([row({ kind: 'team', name: 'forge' })], [], makeTree([]))), []);
  });
});

describe('trackedSourcesAt - the A2 basis', () => {
  // The whole point of Round 1's A2 rewrite was that `tracked` means `git ls-files`, not
  // `existsSync`. That sentence lived only in a comment and in an untested main() body.
  const { execFileSync } = require('child_process');

  it('enumerates tracked files and omits untracked ones', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'name-registry-git-'));
    tmpDirs.push(dir);
    initGitFixture(dir);
    const rel = '_bmad/bme/_gyre/agents/stack-detective.md';
    fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), 'x', 'utf8');
    fs.writeFileSync(path.join(dir, '_bmad/bme/_gyre/agents/untracked.md'), 'x', 'utf8');
    execFileSync('git', ['add', rel], { cwd: dir });

    const tracked = trackedSourcesAt(dir);
    assert.ok(tracked.has(rel), 'the added file is tracked');
    assert.ok(!tracked.has('_bmad/bme/_gyre/agents/untracked.md'), 'the other file is not');
  });

  it('returns an empty set - never a throw - for a repo with nothing under _bmad/bme', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'name-registry-git-'));
    tmpDirs.push(dir);
    initGitFixture(dir);
    assert.equal(trackedSourcesAt(dir).size, 0);
  });

  it('throws GitUnavailableError outside a repository rather than reporting a clean tree', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'name-registry-nogit-'));
    tmpDirs.push(dir);
    assert.throws(() => trackedSourcesAt(dir), GitUnavailableError);
  });

  it('main() exits 1 on a tree git cannot enumerate, instead of passing vacuously', () => {
    // An empty enumeration would make A2 pass while checking nothing. This is the exact
    // vacuous-pass class the script exists to prevent, so it must fail to run.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'name-registry-nogit-'));
    tmpDirs.push(dir);
    const rel = '_bmad/bme/_config/name-registry.csv';
    fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), `${HEADER.join(',')}\n${row({ kind: 'team' }).join(',')}\n`, 'utf8');
    assert.equal(main(['node', 's', '--root', dir]), 1);
  });
});

describe('isV5AgentFile', () => {
  it('accepts a complete v5 block', () => {
    assert.equal(isV5AgentFile(v5('Isla')), true);
  });

  it('rejects any three-of-four subset, so a partial quotation is not mistaken for an agent', () => {
    const full = v5('Isla');
    for (const marker of ['<agent id=', '<activation', '<persona>', '</agent>']) {
      assert.equal(isV5AgentFile(full.replace(marker, 'REMOVED')), false, `${marker} should be required`);
    }
  });

  it('accepts every real v5 file shape and rejects converted markdown', () => {
    assert.equal(isV5AgentFile('---\nname: x\n---\n\n# Heading\n\nProse.\n'), false);
  });
});

describe('the completion metric cannot be faked', () => {
  // The Round 2 finding this exists for: the convention branch returned clean on a
  // canonical frontmatter name BEFORE testing the body, so adding one line to each v5
  // file drove "N still v5 ... reaching 0 is I97 Epic 2 complete" to zero with no
  // conversion done at all.
  const emma = [{ name: 'Emma', id: 'contextualization-expert', module: 'vortex' }];

  it('fails a file that claims the canonical name while its body is still a v5 agent', () => {
    const halfDone = v5('Emma', 'bmad-bme-agent-emma');
    const tree = makeTree([vortexAgent('contextualization-expert', halfDone)]);
    const findings = checkAgentSources([row({ name: 'Emma' })], IDX, emma, tree.dir, tree.tracked);
    assert.deepEqual(ids(findings), ['convention/half-converted']);
    assert.equal(findings[0].severity, 'BROKEN', 'a fakeable metric must fail closed');
  });

  it('fails, rather than NOTEs, a wrongly-named file quoting a COMPLETE old agent block', () => {
    // Round 1 raised the bar from one marker to four; Round 2 showed four is still
    // imitable by a migration note. The name is now decided first and this fails closed.
    const documented = v5('Emma', 'not-the-canonical-name');
    const tree = makeTree([vortexAgent('contextualization-expert', documented)]);
    const findings = checkAgentSources([row({ name: 'Emma' })], IDX, emma, tree.dir, tree.tracked);
    assert.equal(findings[0].severity, 'NOTE');
    assert.equal(ids(findings)[0], 'convention/v5-unconverted');
  });

  it('reads the display name out of a v5 source, which no registry comparison can see', () => {
    // Renaming an agent in BOTH registries while leaving the source alone used to pass
    // green while the agent went on introducing itself by the old name.
    const renamed = [{ name: 'Ranger', id: 'stack-detective', module: 'gyre' }];
    const tree = makeTree([gyreAgent('stack-detective', v5('Scout'))]);
    const findings = checkAgentSources(
      [row({ name: 'Ranger', declared_in: 'gyre' })], IDX, renamed, tree.dir, tree.tracked
    );
    assert.ok(ids(findings).includes('drift/source-name'));
  });
});

describe('audit', () => {
  const emma = [{ name: 'Emma', id: 'contextualization-expert', module: 'vortex' }];

  it('reports header problems alone, without cascading into cells it cannot locate', () => {
    const findings = audit({
      header: ['kind'],
      rows: [],
      agents: [],
      projectRoot: '/nonexistent',
      trackedSources: new Set(),
    });
    assert.ok(findings.every((f) => f.id.startsWith('header/')));
  });

  it('does NOT let one bad enum cell suppress the four assertions', () => {
    // The regression this exists for: a single typo'd tier hid a real drift finding.
    const { dir, tracked } = makeTree([]);
    const rows = [row({ kind: 'team', name: 'bmm', tier: 'TYPO' })];
    const found = ids(audit({ header: HEADER, rows, agents: emma, projectRoot: dir, trackedSources: tracked }));
    assert.ok(found.includes('row/tier'), 'the shape finding still reports');
    assert.ok(found.includes('drift/missing-from-registry'), 'and the drift is no longer hidden');
  });

  it('runs all three content checks once the header is sound', () => {
    const { dir, tracked } = makeTree([]);
    const rows = [row({ name: 'Emma' }), row({ name: 'Emma' }), row({ name: 'Ghost' })];
    const found = ids(audit({ header: HEADER, rows, agents: emma, projectRoot: dir, trackedSources: tracked }));
    assert.ok(found.includes('unique/duplicate'), 'A1 ran');
    assert.ok(found.includes('source/untracked'), 'A2 ran');
    assert.ok(found.includes('drift/not-operational'), 'A4 ran');
  });

  it('treats an empty agent list as a failure to run, not a clean result', () => {
    const { dir, tracked } = makeTree([]);
    const found = ids(audit({ header: HEADER, rows: [row()], agents: [], projectRoot: dir, trackedSources: tracked }));
    assert.ok(found.includes('registry/no-agents'));
  });

  it('flags a registry with no data rows', () => {
    const { dir, tracked } = makeTree([]);
    const found = ids(audit({ header: HEADER, rows: [], agents: emma, projectRoot: dir, trackedSources: tracked }));
    assert.ok(found.includes('registry/empty'));
  });
});

describe('severity', () => {
  it('defaults a finding to BROKEN, so a new check fails closed', () => {
    const { rowFindings } = checkShape(HEADER, [row({ tier: 'TYPO' })]);
    assert.equal(rowFindings[0].severity, 'BROKEN');
  });

  it('is the only thing separating a green run from a red one', () => {
    // main() returns 2 iff a BROKEN exists. A tree whose only finding is a v5 NOTE must
    // stay green; the same tree with a non-canonical name must not.
    const emma = [{ name: 'Emma', id: 'contextualization-expert', module: 'vortex' }];
    const noteOnly = makeTree([vortexAgent('contextualization-expert', v5('Emma'))]);
    const brokenOne = makeTree([vortexAgent('contextualization-expert', '---\nname: nope\n---\n')]);
    const at = (t) =>
      audit({ header: HEADER, rows: [row({ name: 'Emma' })], agents: emma, projectRoot: t.dir, trackedSources: t.tracked });
    assert.ok(at(noteOnly).every((f) => f.severity === 'NOTE'));
    assert.ok(at(brokenOne).some((f) => f.severity === 'BROKEN'));
  });
});

describe('operationalAgents', () => {
  it('tags each agent with the module whose directory holds it', () => {
    const flat = operationalAgents({
      AGENTS: [{ name: 'Emma', id: 'a' }],
      GYRE_AGENTS: [{ name: 'Scout', id: 'b' }],
      EXTRA_BME_AGENTS: [{ name: 'Loom Master', id: 'c', submodule: '_team-factory' }],
    });
    assert.deepEqual(
      flat.map((a) => [a.name, a.module]),
      [
        ['Emma', 'vortex'],
        ['Scout', 'gyre'],
        ['Loom Master', 'loom'],
      ]
    );
  });

  it('preserves the submodule field the source of truth carries', () => {
    const flat = operationalAgents({
      AGENTS: [],
      GYRE_AGENTS: [],
      EXTRA_BME_AGENTS: [{ name: 'x', id: 'y', submodule: '_team-factory' }],
    });
    assert.equal(flat[0].submodule, '_team-factory');
  });
});
