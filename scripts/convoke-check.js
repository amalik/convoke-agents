#!/usr/bin/env node

/**
 * Convoke Check — Local CI mirror.
 *
 * Runs the same checks as .github/workflows/ci.yml so failures are caught
 * before push. Intended for use in dev-story step 9 and manual pre-push.
 *
 * Steps (matching CI jobs):
 *   1. Lint          (npm run lint)
 *   2. Unit tests    (npm test)
 *   3. Integration   (npm run test:integration)
 *   4. Jest lib      (npx jest tests/lib/)
 *   5. Coverage      (npm run test:coverage)  [--skip-coverage to omit]
 *
 * @module convoke-check
 */

const { execSync } = require('child_process');
const { findProjectRoot } = require('./update/lib/utils');

const STEPS = [
  { name: 'Lint', cmd: 'npm run lint' },
  { name: 'Unit tests', cmd: 'npm test' },
  { name: 'Integration tests', cmd: 'npm run test:integration' },
  { name: 'Jest lib tests', cmd: 'npx jest tests/lib/ --no-coverage' },
  { name: 'Coverage', cmd: 'npm run test:coverage', skippable: true }
];

function run() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: convoke-check [options]

Runs the full CI-equivalent validation locally.

Options:
  --skip-coverage   Skip the coverage step (faster)
  --help, -h        Show this help
`);
    return;
  }

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.error('Error: Not in a Convoke project. Could not find _bmad/ directory.');
    process.exit(1);
  }

  const skipCoverage = args.includes('--skip-coverage');
  const results = [];
  let failed = false;

  for (const step of STEPS) {
    if (step.skippable && skipCoverage) {
      results.push({ name: step.name, status: 'skipped' });
      continue;
    }

    console.log(`\n--- ${step.name} ---`);
    try {
      execSync(step.cmd, { cwd: projectRoot, stdio: 'inherit' });
      results.push({ name: step.name, status: 'pass' });
    } catch {
      results.push({ name: step.name, status: 'FAIL' });
      failed = true;
      // Continue to run remaining steps so all failures are visible
    }
  }

  // Summary
  console.log('\n=== Convoke Check Summary ===');
  for (const r of results) {
    const icon = r.status === 'pass' ? 'PASS' : r.status === 'skipped' ? 'SKIP' : 'FAIL';
    console.log(`  [${icon}] ${r.name}`);
  }

  if (failed) {
    console.log('\nCI check FAILED. Fix the above issues before pushing.');
    process.exit(1);
  } else {
    console.log('\nAll checks passed. Safe to push.');
  }
}

run();
