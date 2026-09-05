#!/usr/bin/env node
/**
 * Name-registry integrity - deliverable 3 of the meta-model baseline (T124).
 *
 * A LINT over a tracked governance artifact, `_bmad/bme/_config/name-registry.csv`,
 * which ADR-001 (accepted 2026-09-05) makes the declaration point for team and agent
 * names, their provenance tier, and their status.
 *
 * Why an audit script rather than a test: it reads the LIVE tree on purpose. Asserting
 * that the registry agrees with reality is its whole job, so `test-fixture-isolation`
 * would forbid it in `tests/`. The pure logic is covered against fixtures in
 * `tests/audit/name-registry-integrity.test.js`; this file is the live read.
 *
 * FOUR ASSERTIONS (T124):
 *   A1  names unique within kind; a name shared across kinds must be a DECLARED collision
 *   A2  every operational agent row resolves to a TRACKED source file
 *   A3  converted agents follow the BMB-canonical naming convention (I97 architecture D1)
 *   A4  agent rows match `agent-registry.js` - the drift invariant
 *
 * THE REGISTRY IS REPO-SIDE ONLY, BY DECISION. Nothing copies `_bmad/bme/_config/` into
 * an operator's project and nothing should: it governs authoring, and the operator-facing
 * half of A2 is already owned by `convoke-doctor.js:92` (I43, agent skill wrapper check,
 * spanning all bme modules). Do not add it to `package.json` `files[]` without reopening
 * that ruling in T124.
 *
 * A2 DELIBERATELY DOES NOT READ `.claude/skills/`. The baseline memo words this check as
 * "every bmad-agent-bme-* skill resolves", but `.gitignore:62` ignores `.claude/skills/*`,
 * so a fresh CI checkout sees almost nothing there and the check would pass vacuously.
 * We assert the TRACKED source those wrappers are generated from - and `tracked` here
 * means `git ls-files`, not `existsSync`, because an untracked local file satisfies a
 * developer and vanishes in CI, which is the same vacuous pass wearing a different hat.
 * An empty enumeration is a FAILURE TO RUN, never a clean bill of health.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { readManifest } = require('../portability/manifest-csv');
const { findProjectRoot } = require('../update/lib/utils');
const { AGENTS, GYRE_AGENTS, EXTRA_BME_AGENTS } = require('../update/lib/agent-registry');

const REGISTRY = path.join('_bmad', 'bme', '_config', 'name-registry.csv');

const REQUIRED_COLUMNS = ['kind', 'name', 'code', 'scope', 'tier', 'status', 'declared_in', 'collision'];
const VALID_KINDS = ['team', 'agent'];
const VALID_STATUSES = ['shipped', 'in-dev', 'proposed', 'reserved'];
// ADR-001 D4 declares FOUR tiers and no more. `unassigned` is a fifth value this artifact
// needed for proposed teams whose tier has not been decided, and the signed ADR does not
// authorise it - an earlier comment here cited D4 as permitting it, which D4 does not say.
// Recorded as an open item in deferred-work.md: either the ADR gains an amendment or the
// column uses a blank cell. Kept for now so the audit reflects the artifact as authored.
const VALID_TIERS = ['bmad-upstream', 'convoke', 'practice', 'client', 'unassigned'];

// Statuses whose rows describe something that exists operationally. A `proposed` or
// `reserved` agent has no file and no operational registry entry by definition - that is
// what reserving a name MEANS. Source is the 2026-08-15 baseline memo, which specifies a
// registry "letting proposed teams reserve names without being built"; ADR-001 does not
// mention reserving at all, and an earlier comment here miscited its D8 (tier graduation).
const OPERATIONAL = ['shipped', 'in-dev'];

// Fallback only. `EXTRA_BME_AGENTS` entries carry their own `submodule`, and that field
// wins wherever present - hardcoding a second copy of data the source of truth already
// holds is the exact drift class A4 exists to catch, and an earlier draft of this file
// reintroduced it one function above the check.
const MODULE_DIRS = { vortex: '_vortex', gyre: '_gyre' };

class GitUnavailableError extends Error {}

// Only BROKEN fails the gate. NOTE records a state that is true, known and filed - it
// keeps the debt visible without turning a tracked backlog row into permanently red CI.
const finding = (id, detail, severity = 'BROKEN') => ({ id, detail, severity });
const note = (id, detail) => finding(id, detail, 'NOTE');

/**
 * One normalisation for every name comparison in this file. Unicode form and a
 * non-breaking space are invisible in a diff and would let two spellings of one name both
 * register - a uniqueness gate that can be defeated by a keystroke nobody can see is not
 * a uniqueness gate.
 */
const norm = (s) =>
  String(s ?? '')
    .normalize('NFKC')
    .replace(/[\u00ad\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * The operational registry, flattened. `agent-registry.js:2-5` calls itself the canonical
 * single source of truth for agents, consumed by six modules; the name registry is a
 * SECOND file that also lists agents. Their scopes differ - one is operational, the other
 * nomenclature including reserved names for unbuilt teams - but they overlap on the agents
 * that exist, and I122 (`agent-manifest.csv` rot) is the precedent for what an unchecked
 * registry does. A4 turns that overlap into an enforced invariant.
 */
function operationalAgents(registry = { AGENTS, GYRE_AGENTS, EXTRA_BME_AGENTS }) {
  return [
    ...registry.AGENTS.map((a) => ({ ...a, module: 'vortex' })),
    ...registry.GYRE_AGENTS.map((a) => ({ ...a, module: 'gyre' })),
    // `module` is the TEAM label that `declared_in` is checked against; the DIRECTORY
    // comes from `a.submodule` at the resolution site. ADR-001 D2 makes those different
    // objects, and an earlier attempt at this fix collapsed them - deriving `loom` from
    // `_team-factory` would have made the team label a function of the directory name,
    // which is the conflation the ADR exists to end.
    //
    // `agent-registry.js` carries no team field, so `loom` cannot be derived and is
    // asserted here. `checkAgentSources` reports it rather than guessing silently if a
    // second standalone agent ever appears under a different submodule.
    ...registry.EXTRA_BME_AGENTS.map((a) => ({ ...a, module: a.team || 'loom' })),
  ];
}

/** Every tracked file under `_bmad/bme/`, repo-relative with forward slashes. */
function trackedSourcesAt(projectRoot) {
  let out;
  try {
    // `-z` plus `core.quotePath=false`: by default git renders a non-ASCII path as an
    // escaped, quoted string, which would never match the plain key `rel()` builds and
    // would report a tracked file as untracked.
    out = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '-z', '_bmad/bme'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    throw new GitUnavailableError(`git ls-files failed in ${projectRoot}: ${err.message}`);
  }
  return new Set(out.split('\0').filter(Boolean));
}

/**
 * The frontmatter block, parsed as a block rather than sniffed from a fixed prefix.
 * An earlier draft read a 512-byte slice with a loose regex, which failed three ways at
 * once: a long `description:` pushed `name:` out of range, `\s*` spanned the newline so an
 * empty value captured the closing `---`, and a quoted value - the style every Gyre and
 * loom agent file already uses - was reported as non-canonical with the quotes attached.
 */
function frontmatterName(source) {
  // `readManifest` strips a BOM for the CSV; agent sources are read raw, so a BOM would
  // defeat the `^---` anchor and report a correctly named file as having no name.
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!block) return null;
  const line = /^name:[ \t]*(.+?)[ \t]*\r?$/m.exec(block[1]);
  if (!line) return null;
  const raw = line[1].trim();
  const unquoted = /^(['"])([\s\S]*)\1$/.exec(raw);
  if (unquoted) return unquoted[2].trim() || null;
  // A block scalar (`name: >` / `name: |`) carries its value on following lines. Reading
  // the indicator as the name would report a nonsense declared name; treat it as absent.
  if (/^[>|][0-9+-]*$/.test(raw)) return null;
  // An unquoted YAML scalar ends at an unescaped ` #`.
  return raw.replace(/\s+#.*$/, '').trim() || null;
}

/**
 * A COMPLETE v5 agent block, not a passing mention of one. Testing `<agent id=` alone let
 * a wrongly-named agent excuse itself by merely documenting the old shape in prose - a
 * real BROKEN downgraded to a non-failing NOTE by a line of documentation, and the check
 * getting weaker exactly as migration notes got better. All nine v5 files on disk carry
 * all four markers; all three converted files carry none. Quoting an entire agent block
 * is the only way to imitate this, and a file that does is not documentation.
 */
function isV5AgentFile(source) {
  return (
    /^\s*<agent\s+id=/m.test(source) &&
    /<activation/.test(source) &&
    /<persona>/.test(source) &&
    /<\/agent>/.test(source)
  );
}

/** A1 - uniqueness of names and codes; cross-kind reuse must declare THIS collision. */
function checkUniqueness(rows, idx) {
  const findings = [];

  const seen = new Set();
  for (const row of rows) {
    // A blank name is legal on a `reserved` row and means "not chosen yet" (the baseline
    // memo's reserve-without-building rule, not ADR-001, which is silent on reserving).
    // Two such rows are two open reservations, not one name used twice.
    if (!norm(row[idx.name])) continue;
    const key = `${norm(row[idx.kind])} ${norm(row[idx.name])}`;
    if (seen.has(key)) {
      findings.push(
        finding('unique/duplicate', `${row[idx.kind]} "${row[idx.name]}" appears more than once`)
      );
    }
    seen.add(key);
  }

  // `code` (VTX, GYR, FRG...) is a second namespace in the same governance file, and three
  // letter handles are the most collision-prone identifiers it carries. Blank is legal;
  // duplicated is not.
  const codes = new Set();
  for (const row of rows) {
    const code = norm(row[idx.code]);
    if (!code) continue;
    if (codes.has(code)) {
      findings.push(finding('unique/duplicate-code', `code "${row[idx.code]}" is used by more than one row`));
    }
    codes.add(code);
  }

  const byName = new Map();
  for (const row of rows) {
    const n = norm(row[idx.name]);
    if (!n) continue;
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(row);
  }
  for (const [name, group] of byName) {
    if (new Set(group.map((r) => norm(r[idx.kind]))).size < 2) continue;
    // The collision text must name the collision at hand. Accepting ANY non-empty cell
    // meant a row already carrying prose about an unrelated name was immunised against
    // every future collision - and the names most likely to collide are exactly the ones
    // that already carry collision prose.
    // Word-boundary, not substring: `Max` was satisfied by "maximum WIP", `Loom` by
    // "a looming rename". Round 1 narrowed "any text" to "text containing the name";
    // ordinary governance prose hits that by accident on six live names.
    const bounded = new RegExp(`(^|[^\\p{L}\\p{N}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`, 'u');
    const declares = group.some((r) => bounded.test(norm(r[idx.collision])));
    if (!declares) {
      findings.push(
        finding(
          'unique/undeclared-collision',
          `"${group[0][idx.name]}" is used by both a team and an agent, and no row's collision ` +
            `cell mentions that name. Cross-kind reuse is allowed, but it must be recorded ` +
            `against the name it collides on, not merely somewhere on the row.`
        )
      );
    }
  }
  return findings;
}

/** A2 + A3 - the agent's tracked source file, and the convention its name follows. */
function checkAgentSources(rows, idx, agents, projectRoot, trackedSources) {
  const findings = [];
  const audited = new Set();
  const byName = new Map(agents.map((a) => [norm(a.name), a]));

  for (const row of rows) {
    if (norm(row[idx.kind]) !== 'agent') continue;
    if (!OPERATIONAL.includes(norm(row[idx.status]))) continue;

    const agent = byName.get(norm(row[idx.name]));
    // A4 reports this mismatch itself; skipping here stops one defect producing two findings.
    if (!agent) continue;
    // Two rows naming one agent is A1's finding to report, not a reason to audit the same
    // file twice - duplicate notes also corrupted the v5 count printed by main().
    if (audited.has(agent.id)) continue;
    audited.add(agent.id);

    // `submodule` on the agent wins; the map is a fallback for the two registries that do
    // not carry one. An unknown module is a hard finding rather than a wrong-directory
    // guess, because guessing produces a misleading `source/missing` path.
    const moduleDir = agent.submodule || MODULE_DIRS[agent.module];
    if (agent.submodule && agent.submodule !== '_team-factory' && !agent.team) {
      findings.push(
        finding(
          'drift/unlabelled-team',
          `${row[idx.name]}: lives in ${agent.submodule} but agent-registry.js carries no ` +
            `team field, so its team label was assumed to be "loom". Add one before ` +
            `declared_in can be checked for this agent.`
        )
      );
      continue;
    }
    if (!moduleDir) {
      findings.push(
        finding(
          'source/unknown-module',
          `${row[idx.name]}: no directory known for module "${agent.module}" and the agent ` +
            `declares no submodule`
        )
      );
      continue;
    }

    // An id must be a single path segment. Anything else escapes the module directory and
    // could satisfy A2 against a file that is not this agent's source at all.
    // Both the id and the submodule are interpolated into a filesystem path. An earlier
    // draft guarded only the id, and `path.basename` returns `..` unchanged, so neither
    // check caught a traversal segment.
    const unsafe = (seg) => seg !== path.basename(seg) || seg === '..' || seg === '.';
    if (unsafe(agent.id) || unsafe(moduleDir)) {
      findings.push(
        finding(
          'source/unsafe-id',
          `${row[idx.name]}: id "${agent.id}" / module dir "${moduleDir}" is not a single ` +
            `safe path segment`
        )
      );
      continue;
    }

    const rel = (...parts) => ['_bmad', 'bme', moduleDir, 'agents', ...parts].join('/');
    const folderRel = rel(agent.id, 'SKILL.md');
    const flatRel = rel(`${agent.id}.md`);
    const sourceRel = trackedSources.has(folderRel)
      ? folderRel
      : trackedSources.has(flatRel)
        ? flatRel
        : null;

    if (!sourceRel) {
      const onDisk =
        fs.existsSync(path.join(projectRoot, folderRel)) || fs.existsSync(path.join(projectRoot, flatRel));
      findings.push(
        finding(
          'source/untracked',
          onDisk
            ? `${row[idx.name]} (${agent.id}): a source file exists on disk but is NOT tracked by ` +
              `git, so it would be absent in CI and in the published package`
            : `${row[idx.name]} (${agent.id}): neither ${folderRel} nor ${flatRel} is tracked`
        )
      );
      continue;
    }

    // The registry's own `declared_in` must agree with where the agent actually lives.
    // It is a required column, and an earlier draft required it while reading it nowhere.
    if (norm(row[idx.declared_in]) !== norm(agent.module)) {
      findings.push(
        finding(
          'drift/module-mismatch',
          `${row[idx.name]}: declared_in is "${row[idx.declared_in]}" but agent-registry.js ` +
            `places it in "${agent.module}"`
        )
      );
    }

    let source;
    try {
      source = fs.readFileSync(path.join(projectRoot, sourceRel), 'utf8');
    } catch (err) {
      findings.push(
        finding('source/unreadable', `${row[idx.name]} (${agent.id}): cannot read ${sourceRel} (${err.code})`)
      );
      continue;
    }

    // A3, decided by the file's CONTENT and never by its directory shape. An earlier draft
    // keyed on folder-per-agent and so skipped the convention check for every flat `.md`
    // agent - five of twelve, including one that could be entirely empty and still pass.
    //
    // Order matters. A BMB-canonical name is checked FIRST, so a converted agent that
    // merely documents the old `<agent id=` shape in prose is not mistaken for an
    // unconverted one. Only a file with no canonical name at all is then tested for the v5
    // block, whose four instances are filed I97 Epic 2 debt (T87) and not this gate's to
    // fail on. A file with neither is a real defect, which is how an empty file now fails.
    const declared = frontmatterName(source);
    const expected = `bmad-bme-agent-${norm(agent.name).replace(/\s+/g, '-')}`;
    const isV5 = isV5AgentFile(source);

    // A v5 file still carries the operator-facing display name as an XML attribute, and
    // NOTHING else in this audit reads it. Renaming an agent in both registries while
    // leaving the source untouched produced a clean PASS while the agent went on
    // introducing itself by the old name - registry-to-registry agreement is not the
    // drift invariant it claims to be if the artifact itself is never consulted. I122 is
    // cited above as the precedent; this is the shape that precedent actually takes.
    if (isV5) {
      const xmlName = /<agent\b[^>]*\bname="([^"]*)"/.exec(source);
      if (xmlName && norm(xmlName[1]) !== norm(agent.name)) {
        findings.push(
          finding(
            'drift/source-name',
            `${row[idx.name]} (${agent.id}): ${sourceRel} introduces itself as ` +
              `"${xmlName[1]}", but both registries call it "${agent.name}"`
          )
        );
      }
    }

    // ORDER MATTERS, and an earlier draft had it wrong in a way that made the completion
    // metric below fakeable: it returned clean on `declared === expected` BEFORE testing
    // the body, so adding one frontmatter line to a v5 file moved it out of the v5 count
    // and into "convention-checked" with no conversion done. Nine such edits would have
    // driven "reaching 0 is I97 Epic 2 complete" to zero against nine unconverted files.
    //
    // So the body is tested FIRST, and a file that claims the canonical name while still
    // holding a complete v5 agent block is a contradiction rather than a pass. That is
    // fail-closed on purpose: a converted agent that quotes an entire old agent block in
    // its own prose will trip this, and the message names the escape.
    if (isV5 && declared === expected) {
      findings.push(
        finding(
          'convention/half-converted',
          `${row[idx.name]} (${agent.id}): ${sourceRel} declares the canonical name ` +
            `"${expected}" but its body is still a complete v5 agent block (<agent id= + ` +
            `<activation + <persona> + </agent>). Either finish the conversion, or if this ` +
            `is documentation quoting the old shape, break up the block so it is not a ` +
            `complete agent definition.`
        )
      );
      continue;
    }
    if (declared === expected) continue;
    if (declared && declared.startsWith('bmad-bme-agent-')) {
      findings.push(
        finding(
          'convention/not-bmb-canonical',
          `${row[idx.name]} (${agent.id}): ${sourceRel} declares "${declared}", expected ` +
            `"${expected}" per I97 architecture D1`
        )
      );
      continue;
    }
    if (isV5) {
      findings.push(
        note(
          'convention/v5-unconverted',
          `${row[idx.name]} (${agent.id}): ${sourceRel} is still v5 XML, so the BMB-canonical ` +
            `name check does not apply yet (I97 Epic 2, T87)`
        )
      );
      continue;
    }
    findings.push(
      finding(
        declared ? 'convention/not-bmb-canonical' : 'convention/no-name',
        declared
          ? `${row[idx.name]} (${agent.id}): ${sourceRel} declares "${declared}", expected ` +
            `"${expected}" per I97 architecture D1, and carries no v5 XML block to excuse it`
          : `${row[idx.name]} (${agent.id}): ${sourceRel} has no frontmatter name: and no v5 XML block`
      )
    );
  }
  return findings;
}

/** A4 - the drift invariant. Set comparison in both directions, case-insensitive. */
function checkRegistryDrift(rows, idx, agents) {
  const findings = [];

  // A name carried twice by the operational registry is hidden by every Map and Set in
  // this file, and one of the two agents' sources would then never be checked.
  const counts = new Map();
  for (const a of agents) counts.set(norm(a.name), (counts.get(norm(a.name)) || 0) + 1);
  for (const [name, n] of counts) {
    if (n > 1) {
      findings.push(
        finding('drift/duplicate-agent-name', `agent-registry.js carries "${name}" ${n} times`)
      );
    }
  }

  const operationalRows = rows.filter(
    (r) => norm(r[idx.kind]) === 'agent' && OPERATIONAL.includes(norm(r[idx.status]))
  );
  const declared = new Map(operationalRows.map((r) => [norm(r[idx.name]), r[idx.name]]));
  const operational = new Map(agents.map((a) => [norm(a.name), a.name]));

  for (const [key, actual] of operational) {
    if (!declared.has(key)) {
      findings.push(
        finding(
          'drift/missing-from-registry',
          `"${actual}" ships (agent-registry.js) but has no operational row in ${REGISTRY}`
        )
      );
    } else if (declared.get(key) !== actual) {
      // Compared case-insensitively on purpose: an earlier draft compared raw strings here
      // while lowercasing in A2/A3, so one casing slip produced two findings that
      // contradicted each other.
      findings.push(
        finding(
          'drift/name-spelling',
          `"${declared.get(key)}" in ${REGISTRY} and "${actual}" in agent-registry.js ` +
            `differ only by case, Unicode form, or invisible characters - the two spell ` +
            `the same name differently`
        )
      );
    }
  }
  for (const [key, actual] of declared) {
    if (!operational.has(key)) {
      findings.push(
        finding(
          'drift/not-operational',
          `"${actual}" is declared shipped or in-dev in ${REGISTRY} but agent-registry.js ` +
            `does not carry it`
        )
      );
    }
  }
  return findings;
}

function checkShape(header, rows) {
  const headerFindings = [];
  for (const col of REQUIRED_COLUMNS) {
    if (!header.includes(col)) headerFindings.push(finding('header/missing-column', `no "${col}" column`));
  }
  if (headerFindings.length) return { headerFindings, rowFindings: [], idx: null };

  const idx = Object.fromEntries(REQUIRED_COLUMNS.map((c) => [c, header.indexOf(c)]));
  const rowFindings = [];
  if (rows.length === 0) rowFindings.push(finding('registry/empty', `${REGISTRY} has no data rows`));

  for (const row of rows) {
    if (row.length !== header.length) {
      rowFindings.push(
        finding(
          'row/arity',
          `"${row[idx.name] || row[0]}" has ${row.length} cells, header declares ${header.length}`
        )
      );
      continue;
    }
    if (!VALID_KINDS.includes(row[idx.kind])) {
      rowFindings.push(
        finding('row/kind', `"${row[idx.name]}": kind "${row[idx.kind]}" not in ${VALID_KINDS.join('|')}`)
      );
    }
    if (!VALID_STATUSES.includes(row[idx.status])) {
      rowFindings.push(
        finding(
          'row/status',
          `"${row[idx.name]}": status "${row[idx.status]}" not in ${VALID_STATUSES.join('|')}`
        )
      );
    }
    if (!VALID_TIERS.includes(row[idx.tier])) {
      rowFindings.push(
        finding('row/tier', `"${row[idx.name]}": tier "${row[idx.tier]}" not in ${VALID_TIERS.join('|')}`)
      );
    }
    // A reserved row may be deliberately unnamed - that is what reserving means. Source is
    // the baseline memo's reserve-without-building rule; ADR-001 does not cover it.
    if (!norm(row[idx.name]) && row[idx.status] !== 'reserved') {
      rowFindings.push(
        finding('row/unnamed', `a ${row[idx.kind]} row with status "${row[idx.status]}" has no name`)
      );
    }
  }
  return { headerFindings, rowFindings, idx };
}

function audit({ header, rows, agents, projectRoot, trackedSources }) {
  const { headerFindings, rowFindings, idx } = checkShape(header, rows);
  // ONLY a header failure short-circuits, because it alone makes every cell unlocatable.
  // An earlier draft returned on any shape finding, so a single typo'd enum cell silently
  // suppressed all four assertions - one bad cell could hide a real drift.
  if (!idx) return headerFindings;

  if (agents.length === 0) {
    rowFindings.push(
      finding(
        'registry/no-agents',
        'agent-registry.js yielded no agents, so A2/A3/A4 would pass vacuously - this is a ' +
          'failure to run, not a clean result'
      )
    );
  }

  return [
    ...rowFindings,
    ...checkUniqueness(rows, idx),
    ...checkAgentSources(rows, idx, agents, projectRoot, trackedSources),
    ...checkRegistryDrift(rows, idx, agents),
  ];
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let projectRoot = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== '--root') return { error: `unknown argument: ${args[i]}` };
    const value = args[++i];
    if (!value || value.startsWith('--')) return { error: '--root requires a path' };
    if (projectRoot) return { error: '--root given more than once' };
    projectRoot = path.resolve(value);
  }
  return { projectRoot };
}

function main(argv = process.argv) {
  const { projectRoot: flagged, error } = parseArgs(argv);
  if (error) {
    console.error(`error: ${error}`);
    console.error('usage: node scripts/audit/name-registry-integrity.js [--root <path>]');
    return 1;
  }

  const projectRoot = flagged || findProjectRoot();
  if (!projectRoot) {
    console.error('error: not inside a Convoke project (no _bmad ancestor found)');
    console.error('Pass --root <path> to audit a specific tree.');
    return 1;
  }

  let header, rows;
  try {
    ({ header, rows } = readManifest(path.join(projectRoot, REGISTRY)));
  } catch (err) {
    console.error(`error: could not read ${REGISTRY}`);
    console.error(`  ${err.message}`);
    return 1;
  }

  let trackedSources;
  try {
    trackedSources = trackedSourcesAt(projectRoot);
  } catch (err) {
    console.error(`error: ${err.message}`);
    console.error('A2 asserts TRACKED sources, so without git this is a failure, not a pass.');
    return 1;
  }
  if (trackedSources.size === 0) {
    console.error(`error: git tracks no files under _bmad/bme in ${projectRoot}`);
    console.error('An empty enumeration would make A2 pass vacuously, so it fails instead.');
    return 1;
  }

  const agents = operationalAgents();
  const all = audit({ header, rows, agents, projectRoot, trackedSources });
  const broken = all.filter((f) => f.severity === 'BROKEN');
  const notes = all.filter((f) => f.severity === 'NOTE');

  console.log(`Name-registry integrity: ${REGISTRY}`);
  console.log(`  ${rows.length} rows, ${agents.length} operational agents, ${trackedSources.size} tracked bme files\n`);
  for (const f of broken) console.log(`  BROKEN ${f.id}: ${f.detail}`);
  for (const f of notes) console.log(`  NOTE   ${f.id}: ${f.detail}`);

  if (broken.length) {
    console.log(`\nFAIL - ${broken.length} problem(s) across ${rows.length} rows.`);
    return 2;
  }

  // Count the v5 notes, not every note: subtracting all of them let any future NOTE type,
  // or a second note on one agent, silently corrupt the figure and drive it negative.
  const v5Notes = notes.filter((f) => f.id === 'convention/v5-unconverted').length;
  const checked = agents.length - v5Notes;
  console.log(
    `\nPASS - names and codes unique, ${agents.length} agent rows resolve to tracked sources, ` +
      `${checked} convention-checked, and the registry agrees with agent-registry.js.\n` +
      `  Proves the registry is well-formed and undrifted, NOT that any name is a good one.`
  );
  if (v5Notes) {
    console.log(
      `  ${v5Notes} of ${agents.length} agent(s) still v5 XML and therefore outside the ` +
        `convention check. That count reaching 0 is I97 Epic 2 complete.`
    );
  }
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  REGISTRY,
  REQUIRED_COLUMNS,
  VALID_KINDS,
  VALID_STATUSES,
  VALID_TIERS,
  OPERATIONAL,
  MODULE_DIRS,
  GitUnavailableError,
  finding,
  note,
  norm,
  frontmatterName,
  isV5AgentFile,
  operationalAgents,
  trackedSourcesAt,
  checkUniqueness,
  checkAgentSources,
  checkRegistryDrift,
  checkShape,
  audit,
  parseArgs,
  main,
};
