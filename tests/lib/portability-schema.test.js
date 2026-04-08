const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// Story sp-1-1: Define Portability Schema
//
// Validates the portability schema columns added to skill-manifest.csv.
// This story does NOT classify skills — Story 1.2 will do that. These tests
// only assert that the columns exist and that any non-empty values use the
// canonical vocabulary.

const VALID_TIERS = ['standalone', 'light-deps', 'pipeline'];
const VALID_INTENTS = [
  'think-through-problem',
  'define-what-to-build',
  'review-something',
  'write-documentation',
  'plan-your-work',
  'test-your-code',
  'discover-product-fit',
  'assess-readiness',
  'meta-platform',
];
const EXPECTED_HEADER_COLUMNS = [
  'canonicalId',
  'name',
  'description',
  'module',
  'path',
  'install_to_bmad',
  'tier',
  'intent',
  'dependencies',
];

/**
 * RFC-4180-aware CSV row parser. Single source of truth for both
 * column counting and field extraction (P1-P3 from sp-1-1 review).
 *
 * Handles:
 * - Quoted fields containing commas
 * - Escaped quotes (`""` inside a quoted field → literal `"`)
 * - Unquoted fields
 * - Trailing CR (CRLF line endings)
 */
function parseCsvRow(line) {
  // Strip trailing CR for CRLF tolerance
  if (line.endsWith('\r')) line = line.slice(0, -1);

  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // RFC-4180: doubled quote inside a quoted field is a literal "
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/** Counts columns by parsing the row and returning field count. */
function countCsvColumns(line) {
  return parseCsvRow(line).length;
}

describe('Skill manifest portability schema', () => {
  let lines;
  let header;
  let dataRows;

  beforeAll(() => {
    const projectRoot = findProjectRoot();
    const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
    let content = fs.readFileSync(manifestPath, 'utf8');
    // Strip UTF-8 BOM if present (Excel round-trip protection)
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    // Split on \n and ignore lines that are blank or whitespace-only (handles
    // CRLF, CR-only legacy files, and accidental whitespace rows)
    lines = content.split('\n').filter((l) => /\S/.test(l));
    header = lines[0];
    dataRows = lines.slice(1);
  });

  test('Test 1: header contains tier, intent, and dependencies columns in correct order', () => {
    const headerCols = parseCsvRow(header);
    expect(headerCols).toEqual(EXPECTED_HEADER_COLUMNS);
  });

  test('Test 2: every data row has exactly 9 columns (CSV-aware count)', () => {
    expect(dataRows.length).toBeGreaterThan(0);
    for (const row of dataRows) {
      const cols = countCsvColumns(row);
      expect(cols).toBe(9);
    }
  });

  test('Test 3: any non-empty tier value is one of the canonical tiers', () => {
    const headerCols = parseCsvRow(header);
    const tierIndex = headerCols.indexOf('tier');
    expect(tierIndex).toBeGreaterThanOrEqual(0);

    for (const row of dataRows) {
      const fields = parseCsvRow(row);
      const tier = fields[tierIndex];
      if (tier && tier.length > 0) {
        expect(VALID_TIERS).toContain(tier);
      }
    }
  });

  test('Test 4: any non-empty intent value is one of the 9 canonical categories', () => {
    const headerCols = parseCsvRow(header);
    const intentIndex = headerCols.indexOf('intent');
    expect(intentIndex).toBeGreaterThanOrEqual(0);

    for (const row of dataRows) {
      const fields = parseCsvRow(row);
      const intent = fields[intentIndex];
      if (intent && intent.length > 0) {
        expect(VALID_INTENTS).toContain(intent);
      }
    }
  });

  test('Schema doc exists at _bmad/_config/portability-schema.md', () => {
    const projectRoot = findProjectRoot();
    const schemaPath = path.join(projectRoot, '_bmad', '_config', 'portability-schema.md');
    expect(fs.existsSync(schemaPath)).toBe(true);
    const content = fs.readFileSync(schemaPath, 'utf8');
    // Spot-check that the doc covers the required sections
    expect(content).toMatch(/## Tier/);
    expect(content).toMatch(/## Intent/);
    expect(content).toMatch(/## Dependencies/);
    expect(content).toMatch(/## Examples/);
    // Verify all 9 intent categories appear in the doc
    for (const intent of VALID_INTENTS) {
      expect(content).toContain(intent);
    }
    // Verify all 3 tiers appear
    for (const tier of VALID_TIERS) {
      expect(content).toContain(tier);
    }
  });
});
