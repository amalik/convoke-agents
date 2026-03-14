#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { findProjectRoot } = require('./update/lib/utils');
const {
  AGENTS, WORKFLOWS, WORKFLOW_NAMES
} = require('./update/lib/agent-registry');

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
  const agentCount = AGENTS.length;
  const workflowCount = WORKFLOWS.length;

  // Build regex for written-out numbers
  const wordKeys = Object.keys(WORD_TO_NUM).join('|');

  const digitAgentRe = /\b(\d+)\s+agents?\b/gi;
  const wordAgentRe = new RegExp(`\\b(${wordKeys})\\s+agents?\\b`, 'gi');
  const digitWorkflowRe = /\b(\d+)\s+workflows?\b/gi;
  const wordWorkflowRe = new RegExp(`\\b(${wordKeys})\\s+workflows?\\b`, 'gi');

  // Contradictory terminology patterns
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
      if (num !== agentCount && num > 0 && num < 100) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'stale-reference',
          current: m[0], expected: `${agentCount} agents`,
        });
      }
    }

    // Written-out agent counts (e.g., "four agents")
    wordAgentRe.lastIndex = 0;
    while ((m = wordAgentRe.exec(line)) !== null) {
      const num = WORD_TO_NUM[m[1].toLowerCase()];
      if (num !== undefined && num !== agentCount) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'stale-reference',
          current: m[0], expected: `${agentCount} agents`,
        });
      }
    }

    // Digit workflow counts (e.g., "13 workflows")
    digitWorkflowRe.lastIndex = 0;
    while ((m = digitWorkflowRe.exec(line)) !== null) {
      const num = parseInt(m[1], 10);
      if (num !== workflowCount && num > 0 && num < 100) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'stale-reference',
          current: m[0], expected: `${workflowCount} workflows`,
        });
      }
    }

    // Written-out workflow counts (e.g., "thirteen workflows")
    wordWorkflowRe.lastIndex = 0;
    while ((m = wordWorkflowRe.exec(line)) !== null) {
      const num = WORD_TO_NUM[m[1].toLowerCase()];
      if (num !== undefined && num !== workflowCount) {
        findings.push({
          file: filePath, line: lineNum,
          category: 'stale-reference',
          current: m[0], expected: `${workflowCount} workflows`,
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
          current: `table lists ${found.length}/${agentNames.length} agents`,
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
function formatReport(findings) {
  if (findings.length === 0) {
    return [
      '',
      chalk.green.bold('Convoke Docs Audit'),
      chalk.gray(`Registry: ${AGENTS.length} agents, ${WORKFLOWS.length} workflows`),
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
    chalk.gray(`Registry: ${AGENTS.length} agents, ${WORKFLOWS.length} workflows`),
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
