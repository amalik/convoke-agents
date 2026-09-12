#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { findProjectRoot } = require('./update/lib/utils');
// The whole module, so the valid-count derivation can enumerate EVERY roster array rather
// than the three that happened to be named here when it was written (T146, T148).
const agentRegistry = require('./update/lib/agent-registry');
// WORKFLOWS is deliberately not destructured: every workflow COUNT this file states derives
// from the whole registry (T153). Two named rosters remain, at four sites: `AGENTS` drives the
// `contradictoryPatterns` remedies in `checkStaleReferences`, the agent half of
// `checkDocsCoverage`, and `checkIncompleteAgentTables`; `WORKFLOW_NAMES` drives the workflow
// half of `checkDocsCoverage`. (Named, not line-cited: three line numbers written here were
// already stale by the end of the edit that added them.)
// So coverage is Vortex-only on BOTH axes — narrower than the report header advertises, T156.
// One of those sites still emits a BARE count with no subject (the `original (four|4)` remedy),
// which is an unclosed instance of the very defect T153 fixed elsewhere — T157.
const { AGENTS, WORKFLOW_NAMES } = agentRegistry;

/**
 * Valid roster counts for a suffix (`AGENTS` / `WORKFLOWS`), derived from EVERY matching array
 * the registry exports.
 *
 * Pure and registry-injectable on purpose: the generalisation is the whole point of this
 * function, and the only honest way to test it is to hand it a registry with a roster the real
 * one does not have. Reading the live registry inside would make that untestable.
 *
 * Returns the three things a document may legitimately say and nothing else:
 *   - one roster's own size         ("the 7 Vortex agents")
 *   - the whole roster              ("all 12 Convoke agents")
 *   - the teams without the extras  ("11 team agents", INSTALLATION.md)
 *
 * ORDER-INDEPENDENT by construction. Prefix sums over `Object.keys` would make the valid set
 * depend on declaration order, which is arbitrary and would change silently.
 *
 * `EXTRA_` marks a roster excluded from the "team agents" total. **This is a convention this
 * check depends on, not one the registry enforces** — the only roster carrying it is
 * `EXTRA_BME_AGENTS`, which `agent-registry.js` describes as standalone bme agents. (Other keys
 * share the prefix without being rosters; the suffix filter is what separates them, so do not
 * read a prefix match as a roster count.) The hazard is the Team Factory: `derivePrefix()` is
 * kebab -> SCREAMING_SNAKE, so a team literally named `extra-something` produces
 * `EXTRA_SOMETHING_AGENTS` and is silently dropped from the team total, making a correct
 * document read as stale. Filed as T151, which is the ruling that constrains this line.
 */
function rostersFor(registry, suffix) {
  return Object.keys(registry)
    .filter((k) => k.endsWith(suffix) && Array.isArray(registry[k]))
    .map((k) => ({ name: k, size: registry[k].length }));
}

/**
 * How many agents/workflows the registry EXPORTS, summed across every matching roster.
 *
 * Not "how many exist": on the workflow axis this is a known undercount, because `add-team` is
 * owned by an agent whose workflow roster is not exported at all (T150). The report header says
 * `from exported rosters` for exactly this reason.
 *
 * Distinct from `validCountsFor`, which answers a different question — "what may a document
 * claim" — and deliberately excludes `EXTRA_` rosters from its team subtotal. This one includes
 * them, and is what the report header states. Before T153 the header printed `AGENTS.length`,
 * i.e. the Vortex roster, under the word "Registry".
 *
 * Counts roster LENGTHS, not distinct ids; those diverge only when two rosters share an agent,
 * which `agent-registry.js`'s disjointness assertion is supposed to prevent and cannot for a
 * fourth team — see T155.
 */
function rosterTotal(registry, suffix) {
  return rostersFor(registry, suffix).reduce((n, r) => n + r.size, 0);
}

/**
 * The remedy text for a stale count.
 *
 * It enumerates every count the check accepts rather than naming one. That is deliberately
 * less specific than it looks like it could be: the check compares bare numbers and does not
 * know which roster a sentence refers to (T154), so any single figure it printed would be a
 * guess. Before T153 it guessed the Vortex roster every time — and because that figure is
 * itself accepted, following the remedy produced a wrong document the audit then passed.
 */
function expectedCountText(validCounts, noun) {
  const ordered = [...validCounts].sort((a, b) => a - b);
  // Degenerate registries reach here: no matching roster, or every roster empty (validCountsFor
  // drops zeroes). `one of  agents` would tell an operator to write nothing.
  if (ordered.length === 0) {
    return `no ${noun} count is derivable — the registry exports no non-empty roster`;
  }
  // With one roster the check CAN tell which roster is meant, and "one of 7 agents" reads
  // partitively (pick an agent) rather than as the number 7.
  if (ordered.length === 1) {
    return `${ordered[0]} ${noun}`;
  }
  return `one of ${ordered.join(', ')} ${noun} — this check cannot tell which roster is meant (T154)`;
}

function validCountsFor(registry, suffix) {
  const rosters = rostersFor(registry, suffix);
  const total = rosters.reduce((n, r) => n + r.size, 0);
  const withoutExtras = rosters
    .filter((r) => !r.name.startsWith('EXTRA_'))
    .reduce((n, r) => n + r.size, 0);
  // A roster of 0 is not a claim anyone makes; excluding it keeps "0 agents" reportable.
  return new Set([...rosters.map((r) => r.size), total, withoutExtras].filter((n) => n > 0));
}

// --- Constants (Task 1.1, 1.2) ---

/** User-facing docs to audit, relative to project root. */
const USER_FACING_DOCS = [
  'docs/agents.md',
  'docs/development.md',
  'docs/testing.md',
  'docs/faq.md',
  'README.md',
  'UPDATE-GUIDE.md',
  'INSTALLATION.md',
  'CHANGELOG.md',
  'docs/BMAD-METHOD-COMPATIBILITY.md',
  '_bmad/bme/_vortex/guides/EMMA-USER-GUIDE.md',
  '_bmad/bme/_vortex/guides/ISLA-USER-GUIDE.md',
  '_bmad/bme/_vortex/guides/MILA-USER-GUIDE.md',
  '_bmad/bme/_vortex/guides/LIAM-USER-GUIDE.md',
  '_bmad/bme/_vortex/guides/WADE-USER-GUIDE.md',
  '_bmad/bme/_vortex/guides/NOAH-USER-GUIDE.md',
  '_bmad/bme/_vortex/guides/MAX-USER-GUIDE.md',
];

/** Written number words to digit mapping for stale reference detection. */
const WORD_TO_NUM = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
  'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
  'nineteen': 19, 'twenty': 20, 'twenty-one': 21, 'twenty-two': 22,
  'twenty-three': 23, 'twenty-four': 24, 'twenty-five': 25,
  'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28,
  'twenty-nine': 29, 'thirty': 30,
};

// --- Check Functions ---

/**
 * Check for stale numeric references and contradictory terminology.
 * Detects wrong agent/workflow counts (digits and written-out numbers)
 * and contradictory word patterns ("original agents", etc.).
 *
 * @param {string} content - File content
 * @param {string} filePath - Relative file path (for reporting)
 * @returns {Array<object>} findings
 */
function checkStaleReferences(content, filePath) {
  const findings = [];
  const lines = content.split('\n');
  // Three consumers below, not two. `original agents` and `initial agents` name their subject
  // ("Vortex") and so may legitimately cite one roster. `original (four|4)` does NOT — it emits
  // a bare count that the check accepts on re-run, which is T153's own defect, still live at
  // that one site and owned by T157. Every OTHER count remedy in this file derives from the
  // valid set.
  const agentCount = AGENTS.length;

  // Valid counts, derived from EVERY roster array the registry exports (T148).
  //
  // This used to name its arrays literally, which is how T146 happened: `EXTRA_BME_AGENTS`
  // existed, held Loom's `team-factory`, and was simply not in the list — so the true
  // 12-agent roster read as stale while the Vortex+Gyre subtotal passed. Naming them
  // literally also does not survive growth: the Team Factory writes each new team its OWN
  // `{PREFIX}_AGENTS` array (`_team-factory/lib/writers/registry-writer.js:228`) rather than
  // appending to an existing one, so team four would have reintroduced the same defect.
  //
  // Three things a document may legitimately say, and nothing else:
  //   - one roster's own size            ("the 7 Vortex agents")
  //   - the whole roster                 ("all 12 Convoke agents")
  //   - the teams without the extras     ("11 team agents", INSTALLATION.md)
  //
  // The set is ORDER-INDEPENDENT on purpose. Prefix sums over `Object.keys` would make the
  // valid set depend on declaration order, which is arbitrary and would change silently.
  // `EXTRA_` is the registry's own prefix for rosters that are not a team in their own right.
  const validAgentCounts = validCountsFor(agentRegistry, 'AGENTS');
  // Same derivation. ⚠ This one is KNOWN WRONG TODAY — see T150. The registry exports no
  // `EXTRA_BME_WORKFLOWS`, but Loom's `team-factory` owns `add-team`, so the true agent-owned
  // total is rejected while a smaller wrong one passes. Generalising this call did not fix it:
  // the derivation enumerates exports, and the export does not exist. Do not read the green
  // gate as evidence this axis is sound.
  const validWorkflowCounts = validCountsFor(agentRegistry, 'WORKFLOWS');

  // Build regex for written-out numbers
  const wordKeys = Object.keys(WORD_TO_NUM).join('|');

  const digitAgentRe = /\b(\d+)\s+agents?\b/gi;
  const wordAgentRe = new RegExp(`\\b(${wordKeys})\\s+agents?\\b`, 'gi');
  const digitWorkflowRe = /\b(\d+)\s+workflows?\b/gi;
  const wordWorkflowRe = new RegExp(`\\b(${wordKeys})\\s+workflows?\\b`, 'gi');

  // Contradictory terminology patterns.
  // ⚠ The `original (four|4)` entry below fires on any `4` — version strings included — and
  // answers with a bare Vortex count that the audit itself accepts on re-run. That is T153's
  // defect, still live at this one site; T157 owns it. Left exactly as found rather than
  // half-fixed, because narrowing the pattern and rewording the remedy are one decision.
  const contradictoryPatterns = [
    { re: /\boriginal\s+agents?\b/gi, expected: `current ${agentCount}-agent Vortex` },
    { re: /\boriginal\s+(?:four|4)\b/gi, expected: `current ${agentCount} agents` },
    { re: /\binitial\s+agents?\b/gi, expected: `current ${agentCount}-agent Vortex` },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    let m;

    // Digit agent counts (e.g., "4 agents")
    digitAgentRe.lastIndex = 0;
    while ((m = digitAgentRe.exec(line)) !== null) {
      const num = parseInt(m[1], 10);
      if (!validAgentCounts.has(num) && num > 0 && num < 100) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'stale-reference',
          current: m[0], expected: expectedCountText(validAgentCounts, 'agents'),
        });
      }
    }

    // Written-out agent counts (e.g., "four agents")
    wordAgentRe.lastIndex = 0;
    while ((m = wordAgentRe.exec(line)) !== null) {
      const num = WORD_TO_NUM[m[1].toLowerCase()];
      if (num !== undefined && !validAgentCounts.has(num)) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'stale-reference',
          current: m[0], expected: expectedCountText(validAgentCounts, 'agents'),
        });
      }
    }

    // Digit workflow counts (e.g., "13 workflows")
    digitWorkflowRe.lastIndex = 0;
    while ((m = digitWorkflowRe.exec(line)) !== null) {
      const num = parseInt(m[1], 10);
      if (!validWorkflowCounts.has(num) && num > 0 && num < 100) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'stale-reference',
          current: m[0], expected: expectedCountText(validWorkflowCounts, 'workflows'),
        });
      }
    }

    // Written-out workflow counts (e.g., "thirteen workflows")
    wordWorkflowRe.lastIndex = 0;
    while ((m = wordWorkflowRe.exec(line)) !== null) {
      const num = WORD_TO_NUM[m[1].toLowerCase()];
      if (num !== undefined && !validWorkflowCounts.has(num)) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'stale-reference',
          current: m[0], expected: expectedCountText(validWorkflowCounts, 'workflows'),
        });
      }
    }

    // Contradictory terminology
    for (const pattern of contradictoryPatterns) {
      pattern.re.lastIndex = 0;
      while ((m = pattern.re.exec(line)) !== null) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'stale-reference',
          current: m[0], expected: pattern.expected,
        });
      }
    }
  }

  return findings;
}

/**
 * Check for broken internal markdown links [text](target).
 * Excludes external URLs, anchor-only links, and mailto links.
 *
 * @param {string} content - File content
 * @param {string} filePath - Relative file path (for reporting)
 * @param {string} projectRoot - Absolute project root path
 * @returns {Array<object>} findings
 */
function checkBrokenLinks(content, filePath, projectRoot) {
  const findings = [];
  const lines = content.split('\n');
  const fileDir = path.dirname(path.resolve(projectRoot, filePath));
  const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    linkRe.lastIndex = 0;
    let m;
    while ((m = linkRe.exec(line)) !== null) {
      const target = m[2].trim();

      // Skip external, anchor-only, mailto
      if (/^https?:\/\//.test(target)) continue;
      if (target.startsWith('#')) continue;
      if (target.startsWith('mailto:')) continue;

      // Strip anchor for file existence check
      const targetPath = target.split('#')[0];
      if (!targetPath) continue;

      const resolved = path.resolve(fileDir, targetPath);

      if (!fs.existsSync(resolved)) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'broken-link',
          current: target, expected: 'target file should exist',
        });
      }
    }
  }

  return findings;
}

/**
 * Check for stale path references in backtick-wrapped paths.
 * Catches paths like `scripts/something.js` or `_bmad/path/file.md`
 * that reference non-existent files.
 *
 * @param {string} content - File content
 * @param {string} filePath - Relative file path (for reporting)
 * @param {string} projectRoot - Absolute project root path
 * @returns {Array<object>} findings
 */
function checkBrokenPaths(content, filePath, projectRoot) {
  const findings = [];
  const lines = content.split('\n');

  // Match backtick-wrapped paths that start with known project directories
  // and end with a file extension
  const backtickPathRe = /`((?:scripts|docs|tests|\.github|_bmad)\/[^`\s*{}<>]+\.\w+)`/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    backtickPathRe.lastIndex = 0;
    let m;
    while ((m = backtickPathRe.exec(line)) !== null) {
      const refPath = m[1];

      // Skip patterns with wildcards or template variables
      if (refPath.includes('*') || refPath.includes('{')) continue;

      // Skip if this path is also in a markdown link on the same line (avoid duplicate)
      if (line.includes(`](${refPath})`)) continue;

      const resolved = path.resolve(projectRoot, refPath);
      if (!fs.existsSync(resolved)) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'broken-path',
          current: refPath, expected: 'referenced file should exist',
        });
      }
    }
  }

  return findings;
}

/**
 * Check that every agent and workflow in the registry has at least
 * one reference in the user-facing docs.
 *
 * @param {string[]} allDocsContent - Array of doc file contents
 * @returns {Array<object>} findings
 */
function checkDocsCoverage(allDocsContent) {
  const findings = [];
  const combined = allDocsContent.join('\n').toLowerCase();

  // Check each agent has at least one mention by name (word boundary match
  // to avoid false negatives — e.g., "maximize" should not satisfy "Max")
  // Vortex only — Gyre's agents and Loom's `team-factory` have no coverage requirement, although
  // the report header names them. Deliberate and filed, not an oversight: T156.
  for (const agent of AGENTS) {
    const nameRe = new RegExp('\\b' + agent.name.toLowerCase() + '\\b');
    if (!nameRe.test(combined)) {
      findings.push({
        file: 'docs/*', line: 0,
        category: 'missing-coverage',
        current: `agent "${agent.name}" (${agent.id}): no references found`,
        expected: 'at least one documentation reference',
      });
    }
  }

  // Check each workflow has at least one mention by name
  for (const name of WORKFLOW_NAMES) {
    if (!combined.includes(name)) {
      findings.push({
        file: 'docs/*', line: 0,
        category: 'missing-coverage',
        current: `workflow "${name}": no references found`,
        expected: 'at least one documentation reference',
      });
    }
  }

  return findings;
}

/**
 * Check for incomplete agent lists in markdown tables.
 * If a table mentions 3+ agents but is missing some, flag it.
 *
 * @param {string} content - File content
 * @param {string} filePath - Relative file path (for reporting)
 * @returns {Array<object>} findings
 */
function checkIncompleteAgentTables(content, filePath) {
  const findings = [];
  const lines = content.split('\n');
  const agentNames = AGENTS.map(a => a.name.toLowerCase());

  // Only flag tables that appear to be agent-listing tables (one agent
  // per row) but are missing some agents. Skip relationship tables where
  // multiple agents appear per row (contract-flow, comparison tables).
  const minForFlag = agentNames.length - 2; // e.g., 5 out of 7

  // Find contiguous blocks of table rows (lines starting with |)
  let tableStart = -1;
  for (let i = 0; i <= lines.length; i++) {
    const isTableRow = i < lines.length && /^\s*\|/.test(lines[i]);

    if (isTableRow && tableStart === -1) {
      tableStart = i;
    } else if (!isTableRow && tableStart !== -1) {
      const tableRows = lines.slice(tableStart, i);
      const tableText = tableRows.join('\n').toLowerCase();
      const found = agentNames.filter(name => {
        const re = new RegExp('\\b' + name + '\\b');
        return re.test(tableText);
      });
      const missing = agentNames.filter(name => {
        const re = new RegExp('\\b' + name + '\\b');
        return !re.test(tableText);
      });

      if (found.length >= minForFlag && missing.length > 0) {
        // Skip relationship tables: if most data rows contain 2+ agent
        // names, this is a flow/contract table, not an agent listing.
        // Exclude separator rows (|---|) and the header row (first non-separator).
        const nonSeparator = tableRows.filter(r => !/^[\s|:-]+$/.test(r));
        const dataRows = nonSeparator.slice(1); // skip header row
        let multiAgentRows = 0;
        for (const row of dataRows) {
          const rowLower = row.toLowerCase();
          const agentsInRow = agentNames.filter(name => {
            const re = new RegExp('\\b' + name + '\\b');
            return re.test(rowLower);
          });
          if (agentsInRow.length >= 2) multiAgentRows++;
        }
        if (multiAgentRows > dataRows.length / 2) {
          tableStart = -1;
          continue;
        }

        const missingNames = missing.map(n => n.charAt(0).toUpperCase() + n.slice(1));
        findings.push({
          file: filePath,
          line: tableStart + 1,
          category: 'incomplete-agent-table',
          current: `table lists ${found.length}/${agentNames.length} Vortex agents`,
          expected: `missing: ${missingNames.join(', ')}`,
        });
      }
      tableStart = -1;
    }
  }

  return findings;
}

/**
 * Check for internal naming conventions leaking into user-facing prose.
 * Detects `_vortex` outside backtick-wrapped text and code blocks.
 *
 * Scope note: Only `_vortex` is checked. `bme` almost exclusively appears
 * inside backtick-wrapped paths and would produce false positives. `HC\d`
 * (HC1-HC10) are intentional user-facing contract names used throughout
 * docs/agents.md and the user guides — not internal leaks.
 *
 * @param {string} content - File content
 * @param {string} filePath - Relative file path (for reporting)
 * @returns {Array<object>} findings
 */
function checkInternalNamingLeaks(content, filePath) {
  const findings = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Strip inline backtick-wrapped text and markdown link targets before checking
    const prose = line.replace(/`[^`]+`/g, '').replace(/\[[^\]]*\]\([^)]+\)/g, '');

    if (/\b_vortex\b/.test(prose)) {
      findings.push({
        file: filePath, line: lineNum,
        category: 'internal-naming-leak',
        current: '_vortex in prose',
        expected: 'use "Vortex" or wrap in backticks as a path',
      });
    }
  }

  return findings;
}

/**
 * Check for stale product brand references (bmad-enhanced / BMAD-Enhanced).
 * These should have been replaced with "convoke-agents" / "Convoke" during the rename.
 *
 * @param {string} content - File content
 * @param {string} filePath - Relative file path (for reporting)
 * @returns {Array<object>} findings
 */
function checkStaleBrandReferences(content, filePath) {
  const findings = [];
  const lines = content.split('\n');
  const staleRe = /bmad-enhanced|BMAD-Enhanced|BMAD Enhanced/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip lines that document the rename transition (e.g., "bmad-enhanced → convoke-agents")
    if (/→|->/.test(line) && /convoke/i.test(line)) continue;

    staleRe.lastIndex = 0;
    let m;
    while ((m = staleRe.exec(line)) !== null) {
      findings.push({
        file: filePath, line: lineNum,
        category: 'stale-brand-reference',
        current: m[0], expected: 'Convoke (product renamed)',
      });
    }
  }

  return findings;
}

// --- Report Functions (Task 6) ---

/**
 * Format findings as a human-readable chalk-colored report.
 * @param {Array<object>} findings
 * @returns {string}
 */
/** Every roster, not the Vortex one — the word "Registry" was previously false (T153). */
function registryHeader(registry = agentRegistry) {
  const agents = rosterTotal(registry, 'AGENTS');
  const workflows = rosterTotal(registry, 'WORKFLOWS');
  // "from exported rosters" is not padding. The workflow figure is an undercount today — see
  // T150: `_team-factory` owns `add-team` and no `EXTRA_BME_WORKFLOWS` is exported. And the
  // audit's coverage checks span less than this line advertises (T156). Stating the basis is
  // what makes the sentence true.
  return `${agents} agents, ${workflows} workflows (from exported rosters)`;
}

function formatReport(findings) {
  if (findings.length === 0) {
    return [
      '',
      chalk.green.bold('Convoke Docs Audit'),
      chalk.gray(`Registry: ${registryHeader()}`),
      '',
      chalk.green.bold(`\u2713 Docs audit passed \u2014 zero findings.`),
      '',
    ].join('\n');
  }

  // Group by file
  const byFile = {};
  for (const f of findings) {
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);
  }

  // Category counts
  const categories = {};
  for (const f of findings) {
    categories[f.category] = (categories[f.category] || 0) + 1;
  }

  const lines = [
    '',
    chalk.cyan.bold('Convoke Docs Audit Report'),
    chalk.gray(`Registry: ${registryHeader()}`),
    '',
  ];

  for (const [file, fileFindings] of Object.entries(byFile)) {
    lines.push(chalk.yellow.bold(`  ${file}`));
    for (const f of fileFindings) {
      const lineRef = f.line > 0 ? `L${f.line}` : '---';
      lines.push(chalk.red(`    ${lineRef} [${f.category}]`));
      lines.push(chalk.gray(`      Current:  ${f.current}`));
      lines.push(chalk.gray(`      Expected: ${f.expected}`));
    }
    lines.push('');
  }

  const catSummary = Object.entries(categories)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');
  const fileCount = Object.keys(byFile).length;

  lines.push(chalk.red.bold(
    `Found ${findings.length} findings across ${fileCount} files (${catSummary})`
  ));
  lines.push('');

  return lines.join('\n');
}

// --- Main Entry Point (Task 1.3, 1.4) ---

/**
 * Run the docs audit.
 * @param {object} [opts] - Options
 * @param {string} [opts.projectRoot] - Override project root (for testing)
 * @param {boolean} [opts.json] - JSON output mode
 * @returns {Promise<Array<object>>} findings
 */
async function runAudit(opts = {}) {
  const projectRoot = opts.projectRoot || findProjectRoot();

  if (!projectRoot) {
    throw new Error('Could not find Convoke project root (_bmad/ directory)');
  }

  const allFindings = [];
  const allDocsContent = [];

  for (const relPath of USER_FACING_DOCS) {
    const absPath = path.join(projectRoot, relPath);
    if (!fs.existsSync(absPath)) continue;

    const content = fs.readFileSync(absPath, 'utf8');
    allDocsContent.push(content);

    // Skip stale-reference and broken-path checks for CHANGELOG — historical entries
    // reference files that may have been deleted or renamed in past versions
    if (relPath !== 'CHANGELOG.md') {
      allFindings.push(...checkStaleReferences(content, relPath));
      allFindings.push(...checkBrokenPaths(content, relPath, projectRoot));
    }
    allFindings.push(...checkBrokenLinks(content, relPath, projectRoot));
    allFindings.push(...checkIncompleteAgentTables(content, relPath));
    allFindings.push(...checkInternalNamingLeaks(content, relPath));
    allFindings.push(...checkStaleBrandReferences(content, relPath));
  }

  // Coverage check across all docs combined
  allFindings.push(...checkDocsCoverage(allDocsContent));

  return allFindings;
}

async function main() {
  const jsonMode = process.argv.includes('--json');

  try {
    const findings = await runAudit();

    if (jsonMode) {
      console.log(JSON.stringify(findings, null, 2));
    } else {
      console.log(formatReport(findings));
    }

    process.exit(findings.length > 0 ? 1 : 0);
  } catch (err) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(chalk.red(`Docs audit failed: ${err.message}`));
    }
    process.exit(1);
  }
}

// --- Exports (for testing) ---

module.exports = {
  validCountsFor,
  rosterTotal,
  expectedCountText,
  registryHeader,
  USER_FACING_DOCS,
  WORD_TO_NUM,
  checkStaleReferences,
  checkBrokenLinks,
  checkBrokenPaths,
  checkDocsCoverage,
  checkIncompleteAgentTables,
  checkInternalNamingLeaks,
  checkStaleBrandReferences,
  formatReport,
  runAudit,
};

if (require.main === module) {
  main();
}
