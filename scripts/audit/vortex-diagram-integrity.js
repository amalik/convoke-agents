#!/usr/bin/env node
/**
 * Vortex diagram integrity — story docs-1-2.
 *
 * The Vortex handoff diagram is duplicated across three files. All three drew HC9 from Liam
 * into NOAH while the contract table says Liam -> ISLA. A reader following the picture goes to
 * the wrong agent, and two of the three files SHIP (`docs/agents.md`, the one the epic
 * originally scoped, is the only one that does not).
 *
 * TWO MODES, and the split is the point.
 *
 *   --diagnose   ONE-SHOT. Proves the pre-conversion defects in the ASCII art: per-box
 *                edge-column geometry, and an ASCII path-walk binding each HC label to the box
 *                its arrow actually enters. Both subjects CEASE TO EXIST once the diagrams
 *                become mermaid, so this mode is retired with the conversion. It is evidence,
 *                not a gate. Keeping it wired would be a permanently vacuous check — the exact
 *                pattern this epic exists to eliminate.
 *
 *   (default)    PERMANENT GATE. Four assertions whose subjects survive:
 *                  A1 routing       — every mermaid edge terminates where its table row says
 *                  A2 completeness  — every contract and every registry agent is present
 *                  A3 no box art    — no fence carrying an HC label contains U+2500-257F
 *                  A4 corpus sweep  — no HC-labelled diagram outside the declared corpus
 *
 * WHY A3 IS SCOPED TO `HC` FENCES. The Gyre diagram in `docs/agents.md` uses box-drawing glyphs
 * legitimately and is CORRECT (its 61/60/60 spread is Coach's two-column emoji, not a
 * misalignment). Scoping by HC label leaves it alone BY CONSTRUCTION rather than by an
 * exception list that would need maintaining.
 *
 * WHY A4 EXISTS. A hardcoded corpus cannot discover a fourth copy — which is how two SHIPPED
 * copies went unchecked while the epic scoped the one that does not ship. A4 fails if any
 * tracked markdown outside the declared corpus and the declared exclusions carries an
 * HC-labelled diagram.
 *
 * COUNTS ARE DERIVED, NEVER LITERAL (`derive-counts-from-source`). Contracts come from the
 * tables in `docs/agents.md`; agents come from `agent-registry.js`. An eleventh contract makes
 * this fail rather than silently narrowing what it guards.
 *
 * THIS SCRIPT SHIPS (package.json `files[]` contains `scripts/`) but reads `docs/agents.md`,
 * which does NOT ship. The entry point therefore reports a missing corpus as "not a development
 * checkout" and exits non-zero — never a vacuous pass.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { splitRow, isTableLine, isSeparator } = require('./backlog-integrity.js');
const { FENCE_RE } = require('./lib/shipped-links.js');

const ROOT = path.resolve(__dirname, '..', '..');

/** The declared corpus: every file carrying the Vortex handoff diagram. */
const CORPUS = [
  'docs/agents.md',
  '_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md',
  '_bmad/bme/_vortex/compass-routing-reference.md',
];

/** The file the contract tables live in — the source of truth for routing. */
const CONTRACT_SOURCE = 'docs/agents.md';

/**
 * Declared exclusions for the A4 sweep, each with its reason.
 * `_bmad-output/_archive/` holds a FOURTH copy of this diagram carrying the same HC9 defect,
 * inside a closed story artifact that does not ship. Excluded deliberately, not overlooked.
 */
const EXCLUDED = [
  { prefix: '_bmad-output/_archive/', why: 'closed story artifacts; historical record, does not ship' },
  { prefix: '_bmad-output/implementation-artifacts/', why: 'story files quote diagrams as evidence' },
  { prefix: '_bmad-output/planning-artifacts/', why: 'epics and findings notes quote diagrams as evidence' },
];

const BOX_DRAWING = /[─-╿]/;
const HC_LABEL = /\bHC([0-9]{1,2})\b/;
const HC_LABEL_G = /\bHC([0-9]{1,2})\b/g;

// ---------------------------------------------------------------------------
// Render width
// ---------------------------------------------------------------------------

/**
 * Render columns for one string.
 *
 * Iterates by CODEPOINT (`for...of`), not UTF-16 code units: the Gyre diagram's `\u{1F3CB}️`
 * would otherwise be counted twice over.
 *
 * Zero-width: variation selectors, ZWJ, combining marks.
 * Two columns: anything >= U+1F000 (emoji), plus the east-asian Wide/Fullwidth ranges.
 * One column: everything else — INCLUDING the box-drawing and arrow glyphs, which are
 * east-asian AMBIGUOUS. Treating Ambiguous as wide would change every measurement this script
 * reports; `tests/audit/vortex-diagram-integrity.test.js` pins that.
 *
 * NOTE: no dependency is used deliberately. `string-width` and `eastasianwidth` resolve in this
 * checkout as TRANSITIVE DEV dependencies of `c8` (`npm ls string-width --omit=dev` is empty),
 * so requiring one works here and breaks for every operator, because `scripts/` ships.
 */
function renderWidth(str) {
  let width = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfe0f || cp === 0x200d) continue;
    if (cp >= 0x0300 && cp <= 0x036f) continue;
    width += isWide(cp) ? 2 : 1;
  }
  return width;
}

function isWide(cp) {
  if (cp >= 0x1f000) return true;
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6)
  );
}

/** Render column (0-based) of each glyph in `set`, accounting for wide characters. */
function glyphColumns(line, set) {
  const out = [];
  let col = 0;
  for (const ch of line) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfe0f || cp === 0x200d) continue;
    if (set.includes(ch)) out.push({ ch, col });
    col += isWide(cp) ? 2 : 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fences
// ---------------------------------------------------------------------------

/**
 * Enumerate fenced blocks. Uses `FENCE_RE` from `shipped-links.js`, which deliberately permits
 * leading whitespace rather than anchoring at column 0 — an indented fence would otherwise
 * invert fence state for the rest of the file.
 *
 * Returns `{ start, end, info, lines }` with 1-based inclusive line numbers.
 */
function fencedBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  let open = null;
  for (let i = 0; i < lines.length; i++) {
    const m = FENCE_RE.exec(lines[i]);
    if (!m) continue;
    const marker = m[2];
    if (open === null) {
      open = { start: i + 1, marker: marker[0], len: marker.length, info: m[3].trim() };
    } else if (marker[0] === open.marker && marker.length >= open.len) {
      blocks.push({
        start: open.start,
        end: i + 1,
        info: open.info,
        lines: lines.slice(open.start, i),
      });
      open = null;
    }
  }
  return blocks;
}

/**
 * A fence is the HANDOFF FLOW diagram if it draws a MAJORITY of the declared contracts.
 *
 * "Any HC label" was too broad and produced a false positive that would have broken the
 * permanent gate: `compass-routing-reference.md:73-84` is a DECISION TREE, not a flow diagram.
 * It names HC6 and HC8 as conditional annotations ("HC8 if coming from Max") and draws itself
 * with `├── └──`, so the no-box-art assertion would have failed on it forever, and the routing
 * and completeness assertions would have demanded all ten contracts from a tree that is not
 * trying to express them.
 *
 * The threshold is DERIVED from the contract count, not a literal (`derive-counts-from-source`):
 * a flow diagram draws at least half of what the tables declare. The handoff diagram draws 10 of
 * 10; the decision tree draws 2. Like the Gyre diagram, the tree is excluded BY CONSTRUCTION
 * rather than by an exception list that would need maintaining.
 */
function isContractDiagram(block, contractCount) {
  const ids = new Set();
  for (const line of block.lines) {
    let m;
    HC_LABEL_G.lastIndex = 0;
    while ((m = HC_LABEL_G.exec(line)) !== null) ids.add(m[1]);
  }
  if (!contractCount) return ids.size > 0;
  return ids.size >= Math.ceil(contractCount / 2);
}

// ---------------------------------------------------------------------------
// Contracts (source of truth)
// ---------------------------------------------------------------------------

/**
 * Parse `| **HCn** | A -> B | ... |` rows out of the handoff-contract tables.
 *
 * Reuses `isTableLine`/`isSeparator`/`splitRow` from `backlog-integrity.js` rather than
 * re-deriving markdown table semantics: `splitRow` already handles escaped pipes, `isTableLine`
 * already permits GFM's three-space indent, and `isSeparator` already carries the fix for
 * `| | |` promoting a data row into a header.
 *
 * Agent names are taken as the FIRST word of each endpoint cell, so the emoji and any
 * annotation are ignored.
 */
function parseContracts(content) {
  const lines = content.split('\n');
  const contracts = new Map();
  const blocks = fencedBlocks(content);
  const inFence = (n) => blocks.some((b) => n >= b.start && n <= b.end);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isTableLine(line) || isSeparator(line)) continue;
    if (inFence(i + 1)) continue;
    const cells = splitRow(line).map((c) => c.trim());
    // cells[0] is the empty string before the leading pipe
    const idCell = cells[1] || '';
    const m = /^\*{0,2}(HC[0-9]{1,2})\*{0,2}$/.exec(idCell);
    if (!m) continue;
    const flow = cells[2] || '';
    const arrow = flow.split(/[→>]/);
    if (arrow.length < 2) continue;
    const from = firstWord(arrow[0]);
    const to = firstWord(arrow[arrow.length - 1]);
    if (!from || !to) continue;
    contracts.set(m[1], { id: m[1], from, to, line: i + 1 });
  }
  return contracts;
}

function firstWord(cell) {
  const cleaned = cell.replace(/[*`]/g, '').trim();
  const m = /^([A-Za-z][A-Za-z-]*)/.exec(cleaned);
  return m ? m[1] : null;
}

/** Vortex agent first names, derived from the registry — never a literal list. */
function registryAgents() {
  const { AGENTS } = require('../update/lib/agent-registry.js');
  return AGENTS.map((a) => a.name).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Mermaid (the permanent subject)
// ---------------------------------------------------------------------------

/**
 * Parse labelled mermaid edges: `Liam -->|HC9| Isla`, `A --HC9--> B`, and the `-.->`/`==>` forms.
 * Node ids are returned as written; `nodeLabel` resolves `Id[Display Text]` declarations.
 */
function parseMermaidEdges(blockLines) {
  const labels = new Map();
  for (const line of blockLines) {
    const re = /([A-Za-z][\w-]*)\s*[[({]+\s*"?([^"\]})]+)"?\s*[\])}]+/g;
    let d;
    while ((d = re.exec(line)) !== null) labels.set(d[1], d[2].trim());
  }

  const edges = [];
  const pipeForm = /([A-Za-z][\w-]*)\s*[-=.]+>\s*\|\s*([^|]+?)\s*\|\s*([A-Za-z][\w-]*)/g;
  const inlineForm = /([A-Za-z][\w-]*)\s*[-=.]+\s*([A-Za-z0-9]+)\s*[-=.]+>\s*([A-Za-z][\w-]*)/g;

  for (const line of blockLines) {
    let m;
    while ((m = pipeForm.exec(line)) !== null) {
      edges.push({ from: m[1], label: m[2], to: m[3], raw: line.trim() });
    }
    while ((m = inlineForm.exec(line)) !== null) {
      edges.push({ from: m[1], label: m[2], to: m[3], raw: line.trim() });
    }
  }
  return { edges, labels };
}

/** Display name for a node id: its declared label's first word, else the id itself. */
function nodeAgent(id, labels) {
  const label = labels.get(id);
  return label ? firstWord(label) || id : id;
}

module.exports = {
  CORPUS,
  CONTRACT_SOURCE,
  EXCLUDED,
  BOX_DRAWING,
  renderWidth,
  isWide,
  glyphColumns,
  fencedBlocks,
  isContractDiagram,
  parseContracts,
  firstWord,
  registryAgents,
  parseMermaidEdges,
  nodeAgent,
};

// ---------------------------------------------------------------------------
// PERMANENT ASSERTIONS
// ---------------------------------------------------------------------------

/** A1 — every mermaid edge terminates where the contract table says it does. */
function checkRouting(file, block, contracts) {
  const findings = [];
  const { edges, labels } = parseMermaidEdges(block.lines);
  const seen = new Set();

  for (const e of edges) {
    const m = HC_LABEL.exec(e.label);
    if (!m) continue;
    const id = `HC${m[1]}`;
    seen.add(id);
    const contract = contracts.get(id);
    if (!contract) {
      findings.push({ file, type: 'routing', msg: `${id} is drawn but no contract table row declares it` });
      continue;
    }
    const from = nodeAgent(e.from, labels);
    const to = nodeAgent(e.to, labels);
    if (to !== contract.to || from !== contract.from) {
      findings.push({
        file,
        type: 'routing',
        msg: `${id} is drawn ${from} -> ${to}, but the table says ${contract.from} -> ${contract.to}`,
      });
    }
  }
  return { findings, seen };
}

/** A2 — completeness: every contract drawn, every registry agent present as a node. */
function checkCompleteness(file, block, contracts, agents, seen) {
  const findings = [];
  for (const id of contracts.keys()) {
    if (!seen.has(id)) {
      findings.push({ file, type: 'completeness', msg: `${id} is declared in the contract tables but absent from this diagram` });
    }
  }
  const text = block.lines.join('\n');
  for (const agent of agents) {
    if (!new RegExp(`\\b${agent}\\b`).test(text)) {
      findings.push({ file, type: 'completeness', msg: `registry agent ${agent} does not appear in this diagram` });
    }
  }
  return findings;
}

/** A3 — no box-drawing characters inside a fence that carries an HC label. */
function checkNoBoxArt(file, block) {
  const findings = [];
  block.lines.forEach((line, i) => {
    if (!BOX_DRAWING.test(line)) return;
    findings.push({
      file,
      type: 'box-art',
      msg: `line ${block.start + 1 + i}: box-drawing characters in a contract diagram — these must be mermaid`,
    });
  });
  return findings.length ? [findings[0], ...(findings.length > 1 ? [{ file, type: 'box-art', msg: `…and ${findings.length - 1} further line(s) in the same fence` }] : [])] : [];
}

/**
 * A4 — corpus sweep. Fails if any TRACKED markdown outside the declared corpus and the declared
 * exclusions carries an HC-labelled diagram. A hardcoded corpus cannot discover a fourth copy;
 * this can.
 */
function checkCorpusSweep(root, corpus, excluded, contractCount) {
  let tracked;
  try {
    tracked = execFileSync('git', ['ls-files', '*.md'], { cwd: root, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
  } catch {
    return [{ file: '(git)', type: 'sweep', msg: 'git ls-files failed — cannot run the corpus sweep' }];
  }

  const findings = [];
  for (const rel of tracked) {
    if (corpus.includes(rel)) continue;
    if (excluded.some((e) => rel.startsWith(e.prefix))) continue;
    let content;
    try {
      content = fs.readFileSync(path.join(root, rel), 'utf8');
    } catch {
      continue;
    }
    if (!HC_LABEL.test(content)) continue;
    for (const block of fencedBlocks(content)) {
      if (!isContractDiagram(block, contractCount)) continue;
      findings.push({
        file: rel,
        type: 'sweep',
        msg: `contract diagram at lines ${block.start}-${block.end} is outside the declared corpus and not declared as an exclusion`,
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// ONE-SHOT DIAGNOSTIC (retired with the conversion)
// ---------------------------------------------------------------------------

/** Box rows: consecutive lines from a `┌` line through its matching `└` line. */
function boxRows(block) {
  const rows = [];
  let start = null;
  block.lines.forEach((line, i) => {
    if (line.includes('┌')) start = i;
    else if (line.includes('└') && start !== null) {
      rows.push({ from: start, to: i, lines: block.lines.slice(start, i + 1) });
      start = null;
    }
  });
  return rows;
}

/**
 * Geometry diagnostic: per-box edge-column equality.
 *
 * Equal TOTAL line width is not the invariant — it is insufficient. A row can be padded to equal
 * widths while its interior edges sit 1-3 columns out. Routing corners are excluded: a `┘` that
 * closes a path rather than a box is not a delimiter.
 */
function diagnoseGeometry(file, block) {
  const findings = [];
  for (const row of boxRows(block)) {
    const widths = row.lines.map(renderWidth);
    const opens = row.lines[0].split('┌').length - 1;
    const closes = row.lines[row.lines.length - 1].split('└').length - 1;
    const absLine = (i) => block.start + 1 + row.from + i;

    if (opens !== closes) {
      findings.push({
        file,
        type: 'geometry',
        msg: `box row ${absLine(0)}-${absLine(row.lines.length - 1)}: ${opens} box top(s) opened, ${closes} closed`,
      });
    }
    const edgeSets = row.lines.map((l) => glyphColumns(l, '┌┐└┘│').map((g) => g.col).join(','));
    const distinct = [...new Set(edgeSets)];
    if (distinct.length > 1) {
      findings.push({
        file,
        type: 'geometry',
        msg:
          `box row ${absLine(0)}-${absLine(row.lines.length - 1)}: edge columns disagree across the row — ` +
          row.lines.map((l, i) => `L${absLine(i)}[${edgeSets[i]}]`).join(' vs '),
      });
    }
    if (new Set(widths).size > 1) {
      findings.push({
        file,
        type: 'geometry',
        msg: `box row ${absLine(0)}-${absLine(row.lines.length - 1)}: render widths ${widths.join(' / ')}`,
      });
    }
  }
  return findings;
}

/**
 * ASCII routing diagnostic: bind each HC label to the box its arrow actually enters.
 *
 * Walks the vertical rail under (or over) the label's column, tolerating the 1-2 column jitter
 * present in the authored art, until it meets an arrowhead; then resolves that arrowhead's
 * column against the box spans on the nearest border line in that direction.
 */
function diagnoseAsciiRouting(file, block, contracts) {
  const findings = [];
  const lines = block.lines;
  const spansByLine = lines.map((l) => boxSpans(l));

  lines.forEach((line, i) => {
    let m;
    HC_LABEL_G.lastIndex = 0;
    while ((m = HC_LABEL_G.exec(line)) !== null) {
      const id = `HC${m[1]}`;
      const contract = contracts.get(id);
      if (!contract) continue;
      const labelCol = renderWidth(line.slice(0, m.index));
      const at = `line ${block.start + 1 + i} col ${labelCol}`;
      let resolved = false;
      // Horizontal routes first: HC1-HC3 are drawn `─────▶` on the line BELOW their label, so a
      // vertical-rail walker never attempts them. Reporting those as "ambiguous" would blame the
      // diagram for this diagnostic's blind spot.
      for (const dl of [0, 1, -1]) {
        const j = i + dl;
        if (j < 0 || j >= lines.length) continue;
        const heads = glyphColumns(lines[j], '▶◀').filter((g) => Math.abs(g.col - labelCol) <= 8);
        if (!heads.length) continue;
        const head = heads[0];
        const spans = spansByLine[j];
        const box = head.ch === '▶'
          ? spans.find((sp) => sp.start >= head.col)
          : [...spans].reverse().find((sp) => sp.end <= head.col);
        if (!box) continue;
        resolved = true;
        if (box.name !== contract.to) {
          findings.push({
            file,
            type: 'ascii-routing',
            msg: `${id}: horizontal arrow from the label at ${at} enters ${box.name}, but the table says ${contract.from} -> ${contract.to}`,
          });
        }
        break;
      }
      if (resolved) continue;
      for (const dir of [1, -1]) {
        const hit = walkRail(lines, i, labelCol, dir);
        if (!hit) continue;
        const box = resolveBox(spansByLine, hit.line, hit.col, dir);
        if (!box) continue;
        resolved = true;
        if (box !== contract.to) {
          findings.push({
            file,
            type: 'ascii-routing',
            msg: `${id}: arrow from the label at ${at} enters ${box}, but the table says ${contract.from} -> ${contract.to}`,
          });
        }
        break;
      }
      // An UNRESOLVABLE label is a finding, never a silent skip. HC7 and HC10 land here: their
      // delivery rail is interrupted by Emma's box, so no honest walk reaches Isla. Saying
      // nothing about them would make this diagnostic look stronger than it is — the precise
      // failure this epic exists to close.
      if (!resolved) {
        findings.push({
          file,
          type: 'ascii-routing',
          msg: `${id}: label at ${at} cannot be resolved to a terminus — the rail is interrupted or ambiguous. The table says ${contract.from} -> ${contract.to}; the drawing does not say anything decidable.`,
        });
      }
    }
  });
  return findings;
}

function boxSpans(line) {
  const g = glyphColumns(line, '│┌└┐┘');
  const spans = [];
  for (let i = 0; i + 1 < g.length; i += 2) {
    const name = firstWord(sliceByColumn(line, g[i].col + 1, g[i + 1].col));
    if (name) spans.push({ start: g[i].col, end: g[i + 1].col, name });
  }
  return spans;
}

function sliceByColumn(line, from, to) {
  let col = 0;
  let out = '';
  for (const ch of line) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfe0f || cp === 0x200d) continue;
    if (col >= from && col < to) out += ch;
    col += isWide(cp) ? 2 : 1;
  }
  return out;
}

function walkRail(lines, from, col, dir) {
  for (let i = from + dir; i >= 0 && i < lines.length; i += dir) {
    const marks = glyphColumns(lines[i], dir > 0 ? '▼│' : '▲│');
    const near = marks.filter((g) => Math.abs(g.col - col) <= 2);
    if (!near.length) return null;
    const head = near.find((g) => g.ch === '▼' || g.ch === '▲');
    if (head) return { line: i, col: head.col };
    col = near[0].col;
  }
  return null;
}

function resolveBox(spansByLine, from, col, dir) {
  for (let i = from + dir; i >= 0 && i < spansByLine.length; i += dir) {
    const spans = spansByLine[i];
    if (!spans.length) continue;
    const hit = spans.find((s) => col >= s.start && col <= s.end);
    return hit ? hit.name : null;
  }
  return null;
}

Object.assign(module.exports, {
  checkRouting,
  checkCompleteness,
  checkNoBoxArt,
  checkCorpusSweep,
  boxRows,
  diagnoseGeometry,
  diagnoseAsciiRouting,
  boxSpans,
});

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function audit({ root = ROOT, diagnose = false } = {}) {
  const findings = [];

  const contractPath = path.join(root, CONTRACT_SOURCE);
  if (!fs.existsSync(contractPath)) {
    // This script ships; `docs/agents.md` does not. A missing corpus means an installed tree,
    // not a passing run. Never report success here.
    return { ok: false, notACheckout: true, findings: [] };
  }

  const contracts = parseContracts(fs.readFileSync(contractPath, 'utf8'));
  if (contracts.size === 0) {
    return {
      ok: false,
      findings: [{ file: CONTRACT_SOURCE, type: 'source', msg: 'no contract rows parsed — the tables moved or changed shape; refusing to report a vacuous pass' }],
      contracts,
    };
  }
  const agents = registryAgents();

  for (const rel of CORPUS) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      findings.push({ file: rel, type: 'corpus', msg: 'declared corpus file is missing' });
      continue;
    }
    const blocks = fencedBlocks(fs.readFileSync(abs, 'utf8')).filter((b) => isContractDiagram(b, contracts.size));
    if (blocks.length === 0) {
      findings.push({ file: rel, type: 'corpus', msg: 'no contract diagram found — the declared corpus says this file has one' });
      continue;
    }
    for (const block of blocks) {
      if (diagnose) {
        findings.push(...diagnoseGeometry(rel, block));
        findings.push(...diagnoseAsciiRouting(rel, block, contracts));
        continue;
      }
      findings.push(...checkNoBoxArt(rel, block));
      const { findings: routing, seen } = checkRouting(rel, block, contracts);
      findings.push(...routing);
      findings.push(...checkCompleteness(rel, block, contracts, agents, seen));
    }
  }

  if (!diagnose) findings.push(...checkCorpusSweep(root, CORPUS, EXCLUDED, contracts.size));

  return { ok: findings.length === 0, findings, contracts, agents };
}

function main(argv = process.argv.slice(2)) {
  const diagnose = argv.includes('--diagnose');
  const result = audit({ diagnose });

  if (result.notACheckout) {
    console.error('vortex-diagram-integrity: not a development checkout');
    console.error(`  ${CONTRACT_SOURCE} is absent. This script ships inside the package but its`);
    console.error('  subject does not. Run it from a clone, not an installed tree.');
    return 2;
  }

  const mode = diagnose ? 'DIAGNOSE (one-shot; retired with the mermaid conversion)' : 'GATE';
  console.log(`\nVortex diagram integrity — ${mode}`);
  console.log(`Contracts: ${result.contracts.size} (derived from ${CONTRACT_SOURCE})`);
  if (result.agents) console.log(`Registry agents: ${result.agents.length}`);
  console.log('');

  if (result.ok) {
    console.log(diagnose ? '  no geometry or ASCII-routing defects found.' : '  ✓ all assertions pass.');
    console.log('');
    return 0;
  }

  const byFile = new Map();
  for (const f of result.findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  for (const [file, list] of byFile) {
    console.log(`  ${file}`);
    for (const f of list) console.log(`    [${f.type}] ${f.msg}`);
    console.log('');
  }
  console.log(`Found ${result.findings.length} finding(s) across ${byFile.size} file(s).\n`);
  return 1;
}

Object.assign(module.exports, { audit, main, ROOT });

if (require.main === module) process.exit(main());
