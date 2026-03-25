'use strict';

const fs = require('fs-extra');
const path = require('path');
const { CSV_HEADER, formatCsvRow, csvQuote, deriveCode, toTitleCase } = require('./csv-creator');

/** @typedef {import('../types/factory-types').CreatorResult} CreatorResult */

/**
 * Append a new row to an existing team's module-help.csv.
 * Enhanced Simple safety: read → validate header → append → write (.tmp) → verify → rename.
 *
 * @param {Object} rowData - Data for the new CSV row
 * @param {string} rowData.module - Module path (e.g., "bme/_gyre")
 * @param {string} rowData.workflowName - Workflow name (kebab-case)
 * @param {string} rowData.agentId - Agent ID
 * @param {string} rowData.agentRole - Agent role description
 * @param {string} rowData.teamNameKebab - Team name for command derivation
 * @param {string} rowData.outputLocation - Output directory
 * @param {number} [rowData.sequence] - Optional sequence number (auto-derived if omitted)
 * @param {string} csvPath - Absolute path to existing module-help.csv
 * @returns {Promise<CreatorResult>}
 */
async function appendCsvRow(rowData, csvPath) {
  if (!rowData || !rowData.agentId) {
    return { success: false, filePath: csvPath, rowCount: 0, errors: ['rowData with agentId is required'] };
  }

  // --- Read existing CSV ---
  if (!await fs.pathExists(csvPath)) {
    return { success: false, filePath: csvPath, rowCount: 0, errors: ['module-help.csv does not exist at target path'] };
  }

  let content;
  try {
    content = await fs.readFile(csvPath, 'utf8');
  } catch (err) {
    return { success: false, filePath: csvPath, rowCount: 0, errors: [`Cannot read CSV: ${err.message}`] };
  }

  const lines = content.trim().split('\n');

  // --- Validate header ---
  if (lines[0] !== CSV_HEADER) {
    return { success: false, filePath: csvPath, rowCount: 0, errors: ['CSV header mismatch — file format not recognized'] };
  }

  // --- Duplicate check ---
  const existingRows = lines.slice(1);
  for (const row of existingRows) {
    const cols = row.split(',');
    // Column 8 (index 8) is agent
    if (cols[8] === rowData.agentId) {
      return { success: true, filePath: csvPath, rowCount: existingRows.length, errors: [], skipped: 'agent row already exists' };
    }
  }

  // --- Build new row ---
  const sequence = rowData.sequence || ((existingRows.length + 1) * 10);
  const csvRow = {
    module: rowData.module,
    phase: 'anytime',
    name: toTitleCase(rowData.workflowName),
    code: deriveCode(rowData.workflowName),
    sequence,
    workflow_file: `_bmad/bme/_${rowData.teamNameKebab}/workflows/${rowData.workflowName}/workflow.md`,
    command: `bmad-${rowData.teamNameKebab}-${rowData.workflowName}`,
    required: 'false',
    agent: rowData.agentId,
    options: 'Create Mode',
    description: rowData.agentRole,
    output_location: rowData.outputLocation,
    outputs: rowData.workflowName,
  };

  const newLine = formatCsvRow(csvRow);

  // --- Atomic write (.tmp → verify → rename) ---
  const tmpPath = csvPath + '.tmp';
  try {
    const newContent = content.trimEnd() + '\n' + newLine + '\n';
    await fs.writeFile(tmpPath, newContent, 'utf8');

    // Verify header preserved
    const readBack = await fs.readFile(tmpPath, 'utf8');
    const readLines = readBack.trim().split('\n');
    if (readLines[0] !== CSV_HEADER) {
      await fs.remove(tmpPath);
      return { success: false, filePath: csvPath, rowCount: 0, errors: ['Post-write verification failed: header mismatch'] };
    }

    // Verify row count increased
    if (readLines.length <= lines.length) {
      await fs.remove(tmpPath);
      return { success: false, filePath: csvPath, rowCount: 0, errors: ['Post-write verification failed: row count did not increase'] };
    }

    await fs.rename(tmpPath, csvPath);
  } catch (err) {
    await fs.remove(tmpPath).catch(() => {});
    return { success: false, filePath: csvPath, rowCount: 0, errors: [`Write failed: ${err.message}`] };
  }

  return { success: true, filePath: csvPath, rowCount: existingRows.length + 1, errors: [] };
}

module.exports = { appendCsvRow };
