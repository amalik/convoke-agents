'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { deriveWorkflowNames, toKebab } = require('./config-creator');

/** @typedef {import('../types/factory-types')} Types */

/**
 * Standard module-help.csv header — matches BMB and BMM exactly.
 * Trailing comma is intentional (existing pattern).
 */
const CSV_HEADER = 'module,phase,name,code,sequence,workflow-file,command,required,agent,options,description,output-location,outputs,';

/**
 * Create a per-module module-help.csv for a new team.
 * One row per workflow, matching the BMB/BMM column format.
 *
 * Safety: Simple (write → verify header match). Additive-only (NFR17).
 *
 * @param {Object} specData - Parsed team spec file content
 * @param {string} outputPath - Full path to write module-help.csv
 * @returns {Promise<import('../types/factory-types').CreatorResult>}
 */
async function createCsv(specData, outputPath) {
  // --- Additive-only check (NFR17) ---
  if (await fs.pathExists(outputPath)) {
    return { success: false, filePath: outputPath, rowCount: 0, errors: ['module-help.csv already exists at target path — additive-only, will not overwrite'] };
  }

  // --- Build CSV rows ---
  const rows = buildCsvRows(specData);

  // --- Write CSV ---
  try {
    await fs.ensureDir(path.dirname(outputPath));
    const content = CSV_HEADER + '\n' + rows.map(formatCsvRow).join('\n') + '\n';
    await fs.writeFile(outputPath, content, 'utf8');
  } catch (err) {
    return { success: false, filePath: outputPath, rowCount: 0, errors: [`Write failed: ${err.message}`] };
  }

  // --- Verify header match (Simple safety) ---
  try {
    const readBack = await fs.readFile(outputPath, 'utf8');
    const firstLine = readBack.split('\n')[0];
    if (firstLine !== CSV_HEADER) {
      return { success: false, filePath: outputPath, rowCount: rows.length, errors: ['Verification failed: header mismatch after write'] };
    }
  } catch (err) {
    return { success: false, filePath: outputPath, rowCount: 0, errors: [`Verification failed: ${err.message}`] };
  }

  return { success: true, filePath: outputPath, rowCount: rows.length, errors: [] };
}

/**
 * Build CSV row data from spec.
 * One row per workflow (one workflow per agent).
 * @param {Object} specData
 * @returns {import('../types/factory-types').CsvRow[]}
 */
function buildCsvRows(specData) {
  const modulePath = `bme/_${specData.team_name_kebab}`;
  const outputLocation = specData.integration.output_directory;
  const workflows = deriveWorkflowNames(specData);
  const rows = [];

  for (let i = 0; i < (specData.agents || []).length; i++) {
    const agent = specData.agents[i];
    const workflowName = workflows[i];
    const displayName = toTitleCase(workflowName);
    const code = deriveCode(workflowName);
    const sequence = (i + 1) * 10;

    rows.push({
      module: modulePath,
      phase: 'anytime',
      name: displayName,
      code,
      sequence,
      workflow_file: `_bmad/bme/_${specData.team_name_kebab}/workflows/${workflowName}/workflow.md`,
      command: `bmad-${specData.team_name_kebab}-${workflowName}`,
      required: 'false',
      agent: agent.id,
      options: 'Create Mode',
      description: agent.role,
      output_location: outputLocation,
      outputs: workflowName
    });
  }

  return rows;
}

/**
 * Format a CsvRow into a CSV line string.
 * Matches BMB/BMM format: values with commas/spaces are quoted.
 * Trailing comma included.
 * @param {import('../types/factory-types').CsvRow} row
 * @returns {string}
 */
function formatCsvRow(row) {
  const values = [
    row.module,
    row.phase,
    row.name,
    row.code,
    row.sequence,
    row.workflow_file,
    row.command,
    row.required,
    row.agent,
    row.options,
    csvQuote(row.description),
    row.output_location,
    csvQuote(row.outputs)
  ];
  return values.join(',') + ',';
}

/**
 * Quote a CSV value if it contains commas, quotes, or newlines.
 * @param {string} val
 * @returns {string}
 */
function csvQuote(val) {
  if (val == null || val === '') return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Derive a 2-letter uppercase code from a workflow name.
 * Takes first letter of first two words (e.g., "stack-detection" → "SD").
 * @param {string} name - kebab-case workflow name
 * @returns {string}
 */
function deriveCode(name) {
  const words = name.split('-').filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (words[0] || 'XX').substring(0, 2).toUpperCase();
}

/**
 * Convert kebab-case to Title Case.
 * @param {string} str
 * @returns {string}
 */
function toTitleCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- CLI entry point ---
if (require.main === module) {
  const args = process.argv.slice(2);
  const specFileIdx = args.indexOf('--spec-file');

  if (specFileIdx === -1 || !args[specFileIdx + 1]) {
    console.error('Usage: node csv-creator.js --spec-file <path>');
    process.exit(1);
  }

  const specFilePath = args[specFileIdx + 1];

  (async () => {
    try {
      const specContent = await fs.readFile(specFilePath, 'utf8');
      const specData = yaml.load(specContent);
      const bmeRoot = path.resolve(__dirname, '../../../../');
      const outputPath = path.join(bmeRoot, `_${specData.team_name_kebab}`, 'module-help.csv');
      const result = await createCsv(specData, outputPath);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    } catch (err) {
      console.log(JSON.stringify({ success: false, errors: [err.message] }, null, 2));
      process.exit(1);
    }
  })();
}

module.exports = { createCsv, buildCsvRows, formatCsvRow, csvQuote, deriveCode, toTitleCase, CSV_HEADER };
