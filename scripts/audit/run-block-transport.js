#!/usr/bin/env node
'use strict';

/**
 * run-block-transport — tfr-1-1 (T136).
 *
 * Asserts that no `run:` block in a Team Factory workflow builds a JavaScript
 * object inside the shell string it tells a contributor to paste.
 *
 * WHY THIS IS A GATE AND NOT A ONE-OFF FIX. The blocks are markdown. Nothing
 * executes them, so nothing notices when one rots — which is the whole history
 * of this module: `T130` found six wrong call signatures because "the markdown
 * orchestrating the factory had never been executed", and `T136` is the half of
 * that goal signature-fixing could not reach. A fix without a gate here is a fix
 * that lasts until the next edit.
 *
 * THE DEFECT. Every block is `node -e "…"` — a DOUBLE-quoted shell string. JSON
 * substituted into it loses its own quotes before node ever sees it:
 *
 *   run: node -e "const s = {"team_name":"forge"}; …"
 *   shell hands node:  const s = {team_name:forge};      -> SyntaxError
 *
 * This is not limited to values containing quotes. Plain JSON already fails,
 * because the outer `"` terminates on the JSON's first `"`. Measured 2026-09-14:
 * `{"team_name":"forge","agents":[{"id":"emma"}]}` yields
 * `Expected ',', got '<eof>'`.
 *
 * Why an audit script rather than a `tests/` case: it reads the LIVE workflow
 * files on purpose, and `project-context.md` rule `test-fixture-isolation`
 * forbids that in the suite. The detection logic is covered against fixtures in
 * `tests/audit/run-block-transport.test.js`; this file is the live read. Same
 * split as `scripts/audit/name-registry-integrity.js`.
 */

const fs = require('fs');
const path = require('path');

/**
 * Placeholders whose value is an object or an array. Substituting any of these
 * into a shell string is the defect, regardless of what the object contains.
 *
 * Derived from `step-04-generate.md` §Placeholders, which documents each one's
 * type. Kept as an explicit list rather than inferred: a new object-valued
 * placeholder must be added here deliberately, and a reviewer should see it in
 * the diff.
 */
const OBJECT_PLACEHOLDERS = ['{spec_data}', '{generation_context}', '{agent_file_paths}'];

/**
 * A literal `...` ellipsis standing in for "and the rest" — not valid JavaScript
 * in the position it occupies, so the block cannot run at all.
 *
 * `step-01-scope.md` §4 carries the only instance:
 *   `agents: [{id: '{id1}'}, ...]`
 *
 * NOT a rule about object literals. The first version of this file flagged any
 * `{identifier:` inside a payload, and that fired on two blocks that are
 * CORRECT — `JSON.stringify({ valid: …, id })` at `step-01` §3, and the options
 * object at `step-04` §5c, both of which are authored code whose values are
 * quoted strings and which paste fine. A check that fires on correct input has
 * no discriminating power, which is the same defect as one that never fires
 * (`verification-must-be-falsifiable`). The defect is INTERPOLATING an
 * object-valued placeholder, not writing an object.
 */
const ELLIPSIS_RE = /,\s*\.\.\.\s*[\]}]/;

/** A `run:` line that invokes `node -e`. */
const RUN_LINE_RE = /^run:\s*node\s+-e\s/;

/**
 * Scan one workflow file's text for offending `run:` blocks.
 *
 * @param {string} text - file contents
 * @param {string} label - path used in findings
 * @returns {{file: string, line: number, reason: string, snippet: string}[]}
 */
function scanText(text, label) {
  const findings = [];
  const lines = text.split('\n');

  lines.forEach((line, i) => {
    if (!RUN_LINE_RE.test(line)) return;

    for (const ph of OBJECT_PLACEHOLDERS) {
      if (line.includes(ph)) {
        findings.push({
          file: label,
          line: i + 1,
          reason: `interpolates the object placeholder ${ph} into a shell string`,
          snippet: line.slice(0, 120),
        });
      }
    }

    if (ELLIPSIS_RE.test(line)) {
      findings.push({
        file: label,
        line: i + 1,
        reason: 'contains a literal `...` ellipsis, which is not valid JavaScript here',
        snippet: line.slice(0, 120),
      });
    }
  });

  return findings;
}

/**
 * Collect the workflow files to scan.
 *
 * Derived by walking the workflows tree rather than listing step files, so a new
 * step file is in scope the day it is added — `derive-counts-from-source`.
 *
 * @param {string} projectRoot - absolute path to the repository root
 * @returns {string[]} absolute paths
 */
function workflowFiles(projectRoot) {
  const root = path.join(projectRoot, '_bmad/bme/_team-factory/workflows');
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name.endsWith('.md')) out.push(full);
    }
  };
  walk(root);
  return out.sort();
}

/**
 * Run the audit.
 *
 * @param {string} projectRoot - absolute path to the repository root
 * @returns {{findings: Array, scanned: number, runBlocks: number}}
 */
function audit(projectRoot) {
  const files = workflowFiles(projectRoot);
  const findings = [];
  let runBlocks = 0;

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    runBlocks += text.split('\n').filter(l => RUN_LINE_RE.test(l)).length;
    findings.push(...scanText(text, path.relative(projectRoot, f)));
  }

  return { findings, scanned: files.length, runBlocks };
}

module.exports = { audit, scanText, workflowFiles, OBJECT_PLACEHOLDERS, ELLIPSIS_RE, RUN_LINE_RE };

if (require.main === module) {
  const projectRoot = path.resolve(__dirname, '../..');
  const { findings, scanned, runBlocks } = audit(projectRoot);

  console.log(`run-block transport: ${runBlocks} \`run: node -e\` block(s) across ${scanned} workflow file(s)`);

  if (findings.length === 0) {
    console.log('  ✓ no object is built inside a shell string');
    process.exit(0);
  }

  console.error(`  ✗ ${findings.length} block(s) cannot be pasted verbatim:\n`);
  for (const f of findings) {
    console.error(`    ${f.file}:${f.line}`);
    console.error(`      ${f.reason}`);
    console.error(`      ${f.snippet}…\n`);
  }
  console.error('  A `node -e "…"` payload is a double-quoted shell string: the shell strips the');
  console.error('  JSON\'s own quotes before node parses it. Pass a FILE PATH and read it inside');
  console.error('  the block instead. See tfr-1-1 and backlog row T136.');
  process.exit(1);
}
