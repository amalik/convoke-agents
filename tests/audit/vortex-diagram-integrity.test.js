'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  renderWidth,
  isWide,
  glyphColumns,
  fencedBlocks,
  isContractDiagram,
  parseContracts,
  firstWord,
  parseMermaidEdges,
  nodeAgent,
  checkRouting,
  checkCompleteness,
  checkNoBoxArt,
  boxRows,
  diagnoseGeometry,
} = require('../../scripts/audit/vortex-diagram-integrity.js');

// Fixture-bound tests for the Vortex diagram lint (story docs-1-2).
//
// FIXTURES ONLY. The script itself does the live read; asserting against the real
// `docs/agents.md` here would make these tests fail whenever that file is edited for an
// unrelated reason, which `test-fixture-isolation` forbids.
//
// Every assertion below has a fixture that makes the check FAIL. A test that only shows a
// passing case proves the code runs, not that it discriminates.

const TABLES = [
  '| Contract | Flow | What gets passed |',
  '|----------|------|-----------------|',
  '| **HC1** | Isla 🔍 → Mila 🔬 | artifacts |',
  '| **HC2** | Mila 🔬 → Liam 💡 | artifacts |',
  '| **HC3** | Liam 💡 → Isla 🔍 | a flag |',
].join('\n');

const GOOD_DIAGRAM = [
  '```mermaid',
  'flowchart LR',
  '    Isla["Isla 🔍<br/>Empathize"]',
  '    Mila["Mila 🔬<br/>Synthesize"]',
  '    Liam["Liam 💡<br/>Hypothesize"]',
  '',
  '    Isla -->|HC1| Mila',
  '    Mila -->|HC2| Liam',
  '    Liam -->|HC3| Isla',
  '```',
].join('\n');

function blockOf(text) {
  return fencedBlocks(text)[0];
}

describe('renderWidth', () => {
  it('counts emoji as two columns', () => {
    assert.equal(renderWidth('ab'), 2);
    assert.equal(renderWidth('🔍'), 2);
  });

  it('treats a variation selector and ZWJ as zero width', () => {
    // The Gyre diagram's 🏋️ is U+1F3CB U+FE0F. Counting the selector would shift every
    // column measurement in the diagnostic by one.
    assert.equal(renderWidth('\u{1F3CB}️'), 2);
    assert.equal(renderWidth('‍'), 0);
  });

  it('iterates by codepoint, not UTF-16 code unit', () => {
    // '🔍'.length === 2 in UTF-16. A code-unit loop would return 4 here.
    assert.equal('🔍'.length, 2);
    assert.equal(renderWidth('🔍'), 2);
  });

  it('counts east-asian WIDE characters as two columns', () => {
    // THIS FIXTURE IS LOAD-BEARING. No codepoint with east-asian width W/F below U+1F000
    // appears anywhere in the live corpus — every wide glyph there is caught by the
    // `>= U+1F000` branch. Without this test the W/F range table is dead code.
    assert.equal(isWide(0x4e00), true, 'CJK ideograph is wide');
    assert.equal(renderWidth('一'), 2);
    assert.equal(renderWidth('한'), 2);
    assert.equal(renderWidth('ａ'), 2, 'fullwidth latin');
  });

  it('counts east-asian AMBIGUOUS box-drawing and arrow glyphs as ONE column', () => {
    // Treating Ambiguous as wide would change every number the diagnostic reports. The
    // diagram was authored on the one-column assumption; this pins it.
    for (const ch of ['─', '│', '┌', '┐', '└', '┘', '┴', '▶', '◀', '▲', '▼', '—', '·']) {
      assert.equal(renderWidth(ch), 1, `${ch} must be one column`);
    }
  });
});

describe('glyphColumns', () => {
  it('reports 0-based render columns, shifted by preceding wide glyphs', () => {
    assert.deepEqual(glyphColumns('ab│', '│'), [{ ch: '│', col: 2 }]);
    assert.deepEqual(glyphColumns('🔍│', '│'), [{ ch: '│', col: 2 }]);
  });
});

describe('fencedBlocks', () => {
  it('finds a fence and excludes the delimiter lines from its content', () => {
    const b = blockOf('intro\n```\nbody\n```\nafter');
    assert.deepEqual(b.lines, ['body']);
    assert.equal(b.start, 2);
    assert.equal(b.end, 4);
  });

  it('sees an INDENTED fence', () => {
    // FENCE_RE deliberately permits leading whitespace. An indented fence that went unseen
    // would invert fence state for the rest of the file.
    const blocks = fencedBlocks('  ```\n  body\n  ```\n');
    assert.equal(blocks.length, 1);
  });

  it('captures the info string so a mermaid fence is distinguishable', () => {
    assert.equal(blockOf('```mermaid\nflowchart LR\n```').info, 'mermaid');
  });
});

describe('isContractDiagram', () => {
  it('accepts a fence drawing a majority of the declared contracts', () => {
    assert.equal(isContractDiagram(blockOf(GOOD_DIAGRAM), 3), true);
  });

  it('REJECTS a decision tree that merely mentions one or two contracts', () => {
    // The live false positive this predicate exists for:
    // `compass-routing-reference.md` has a decision tree naming HC6 and HC8 as conditionals
    // and drawing itself with `├── └──`. Under an "any HC label" predicate the no-box-art
    // assertion would have failed on it forever.
    const tree = ['```', '├── YES → Emma 🎯', '│     HC8 if coming from Max', '└── NO → continue', '```'].join('\n');
    assert.equal(isContractDiagram(blockOf(tree), 10), false);
  });

  it('scales the threshold with the contract count rather than a literal', () => {
    const b = blockOf(GOOD_DIAGRAM);
    assert.equal(isContractDiagram(b, 3), true, '3 of 3');
    assert.equal(isContractDiagram(b, 20), false, '3 of 20 is not a flow diagram');
  });
});

describe('parseContracts', () => {
  it('derives endpoints from the tables, ignoring emoji and emphasis', () => {
    const c = parseContracts(TABLES);
    assert.equal(c.size, 3);
    assert.deepEqual({ from: c.get('HC3').from, to: c.get('HC3').to }, { from: 'Liam', to: 'Isla' });
  });

  it('ignores table-shaped lines inside a fence', () => {
    const c = parseContracts(`${TABLES}\n\n\`\`\`\n| **HC9** | Fake 🤖 → Nobody 🤖 |\n\`\`\`\n`);
    assert.equal(c.has('HC9'), false);
  });

  it('returns an empty map when the tables are absent, so callers can refuse a vacuous pass', () => {
    assert.equal(parseContracts('no tables here').size, 0);
  });
});

describe('firstWord', () => {
  it('strips emphasis and stops before the emoji', () => {
    assert.equal(firstWord('**Isla** 🔍'), 'Isla');
    assert.equal(firstWord('  Noah 📡  '), 'Noah');
    assert.equal(firstWord('🔍'), null);
  });
});

describe('parseMermaidEdges', () => {
  it('parses the pipe-label form and resolves node ids to display names', () => {
    const { edges, labels } = parseMermaidEdges(blockOf(GOOD_DIAGRAM).lines);
    assert.equal(edges.length, 3);
    assert.equal(nodeAgent(edges[0].from, labels), 'Isla');
    assert.equal(nodeAgent(edges[0].to, labels), 'Mila');
  });

  it('parses an annotated label, as the shipped copies carry', () => {
    const { edges } = parseMermaidEdges(['    Isla -->|"HC1 · artifact"| Mila']);
    assert.equal(edges.length, 1);
    assert.match(edges[0].label, /HC1/);
  });

  it('falls back to the node id when no display label is declared', () => {
    assert.equal(nodeAgent('Isla', new Map()), 'Isla');
  });
});

describe('checkRouting', () => {
  it('passes when every edge agrees with its table row', () => {
    const { findings } = checkRouting('f.md', blockOf(GOOD_DIAGRAM), parseContracts(TABLES));
    assert.deepEqual(findings, []);
  });

  it('FAILS on a mis-routed contract — the live HC9 defect', () => {
    const bad = GOOD_DIAGRAM.replace('Liam -->|HC3| Isla', 'Liam -->|HC3| Mila');
    const { findings } = checkRouting('f.md', blockOf(bad), parseContracts(TABLES));
    assert.equal(findings.length, 1);
    assert.match(findings[0].msg, /HC3 is drawn Liam -> Mila, but the table says Liam -> Isla/);
  });

  it('FAILS on an edge no contract table declares', () => {
    const bad = GOOD_DIAGRAM.replace('```\n', '```\n').replace('    Isla -->|HC1| Mila', '    Isla -->|HC1| Mila\n    Isla -->|HC9| Mila');
    const { findings } = checkRouting('f.md', blockOf(bad), parseContracts(TABLES));
    assert.match(findings[0].msg, /HC9 is drawn but no contract table row declares it/);
  });
});

describe('checkCompleteness', () => {
  const contracts = parseContracts(TABLES);
  const agents = ['Isla', 'Mila', 'Liam'];

  it('passes when every contract and agent is present', () => {
    const block = blockOf(GOOD_DIAGRAM);
    const { seen } = checkRouting('f.md', block, contracts);
    assert.deepEqual(checkCompleteness('f.md', block, contracts, agents, seen), []);
  });

  it('FAILS on a truncated diagram — the deletion attack the assertion exists for', () => {
    const truncated = GOOD_DIAGRAM.replace('    Mila -->|HC2| Liam\n', '');
    const block = blockOf(truncated);
    const { seen } = checkRouting('f.md', block, contracts);
    const findings = checkCompleteness('f.md', block, contracts, agents, seen);
    assert.match(findings[0].msg, /HC2 is declared in the contract tables but absent/);
  });

  it('FAILS when a registry agent has no node', () => {
    const block = blockOf(GOOD_DIAGRAM);
    const { seen } = checkRouting('f.md', block, contracts);
    const findings = checkCompleteness('f.md', block, contracts, [...agents, 'Wade'], seen);
    assert.match(findings[0].msg, /registry agent Wade does not appear/);
  });
});

describe('checkNoBoxArt', () => {
  it('passes on a mermaid diagram', () => {
    assert.deepEqual(checkNoBoxArt('f.md', blockOf(GOOD_DIAGRAM)), []);
  });

  it('FAILS the moment box art returns to a contract fence', () => {
    const bad = GOOD_DIAGRAM.replace('flowchart LR', 'flowchart LR ┌──┐');
    const findings = checkNoBoxArt('f.md', blockOf(bad));
    assert.equal(findings.length, 1);
    assert.match(findings[0].msg, /box-drawing characters in a contract diagram/);
  });
});

describe('geometry diagnostic (one-shot, retired with the conversion)', () => {
  const ROW = ['```', '┌───┐ ┌───┐', '│ A │ │ B │', '└───┘ └───┘', '```'].join('\n');

  it('passes on an aligned box row', () => {
    assert.deepEqual(diagnoseGeometry('f.md', blockOf(ROW)), []);
  });

  it('FAILS when a box row opens more boxes than it closes — the live ┌4/└3 defect', () => {
    const bad = ROW.replace('└───┘ └───┘', '└───┘');
    const findings = diagnoseGeometry('f.md', blockOf(bad));
    assert.ok(findings.some((f) => /2 box top\(s\) opened, 1 closed/.test(f.msg)));
  });

  it('FAILS on edge-column drift even when total widths match', () => {
    // The reason the invariant is per-box edge equality and not equal line width: this row
    // has identical widths on every line and is still misaligned.
    const drifted = ['```', '┌───┐ ┌───┐', ' │ A │ │ B │', '└───┘ └───┘', '```'].join('\n');
    const findings = diagnoseGeometry('f.md', blockOf(drifted));
    assert.ok(findings.some((f) => /edge columns disagree/.test(f.msg)));
  });

  it('finds no box row in a diagram that has none, rather than inventing one', () => {
    // The Gyre case: a linear rail diagram is not a box row, so a box-row invariant is a
    // category error there rather than a finding.
    const linear = ['```', 'A ──▶ B', '      │', '      └──▶ C', '```'].join('\n');
    assert.equal(boxRows(blockOf(linear)).length, 0);
    assert.deepEqual(diagnoseGeometry('f.md', blockOf(linear)), []);
  });
});
