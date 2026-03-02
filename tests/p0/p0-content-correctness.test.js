'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { discoverAgents, VORTEX_DIR, STEP_PATTERN } = require('./helpers');

// ─── Constants ──────────────────────────────────────────────────

const COMPASS_REF = path.join(VORTEX_DIR, 'compass-routing-reference.md');

// Workflows that intentionally have NO compass table
const COMPASS_EXEMPT = ['vortex-navigation'];

// ─── Dynamic Discovery (NFR5) ───────────────────────────────────

const agents = discoverAgents();

const allWorkflows = agents.flatMap(agent =>
  agent.workflowNames.map((name, i) => ({
    name,
    dir: agent.workflowDirs[i],
    agentName: agent.name,
    agentId: agent.id,
  }))
);

const agentNameMap = new Map(
  agents.map(a => [a.name.toLowerCase(), a])
);

const registeredWorkflowNames = new Set(allWorkflows.map(w => w.name.toLowerCase()));

// ─── Parsing Utilities ──────────────────────────────────────────

/**
 * Find the final (highest-numbered) step file in a workflow directory.
 * Compass sections always appear in the last step file.
 */
function findFinalStepFile(workflowDir) {
  const stepsDir = path.join(workflowDir, 'steps');
  if (!fs.existsSync(stepsDir)) return null;
  const stepFiles = fs.readdirSync(stepsDir)
    .filter(f => STEP_PATTERN.test(f))
    .sort();
  return stepFiles.length > 0
    ? path.join(stepsDir, stepFiles[stepFiles.length - 1])
    : null;
}

/**
 * Extract the ## Vortex Compass section from step file content.
 * Returns section content as string, or null if no compass section.
 */
function extractCompassSection(content) {
  const match = content.match(/## Vortex Compass\n([\s\S]*?)(?=\n## [^#]|$)/);
  return match ? match[0] : null;
}

/**
 * Parse a compass markdown table into structured data.
 * Returns { headers, rows, hasFooter } or null if no valid table.
 */
function parseCompassTable(compassContent) {
  const lines = compassContent.split('\n');
  const tableLines = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableLines.push(trimmed);
    } else if (inTable) {
      break; // End of table
    }
  }

  if (tableLines.length < 3) return null; // Need header + separator + at least 1 row

  // Parse header row
  const headerCells = tableLines[0]
    .split('|')
    .filter(c => c.trim() !== '')
    .map(c => c.trim());

  // Skip separator row (index 1), parse data rows
  const rows = [];
  for (let i = 2; i < tableLines.length; i++) {
    const cells = tableLines[i]
      .split('|')
      .filter(c => c.trim() !== '')
      .map(c => c.trim());
    // Skip separator rows
    if (/^[\s-|]+$/.test(tableLines[i].replace(/\|/g, ''))) continue;
    if (cells.length >= 4) {
      rows.push({
        condition: cells[0],
        workflow: cells[1],
        agent: cells[2],
        why: cells[3],
      });
    }
  }

  // Check for footer containing "evidence-based recommendations" (scoped before ### subheadings)
  const mainContent = compassContent.split(/\n###/)[0];
  const hasFooter = mainContent
    .toLowerCase()
    .includes('evidence-based recommendations');

  return { headers: headerCells, rows, hasFooter };
}

/**
 * Extract the lowercase agent name from a compass table Agent cell.
 * e.g., "Mila 🔬" → "mila"
 */
function extractAgentName(agentCell) {
  const match = agentCell.match(/^(\w+)/);
  return match ? match[1].toLowerCase() : null;
}

// ─── Test Suite: Compass Table Presence (AC: 3, 6, 7) ──────────

describe('Compass Table Presence', () => {
  const nonExemptWorkflows = allWorkflows.filter(
    w => !COMPASS_EXEMPT.includes(w.name)
  );
  const exemptWorkflows = allWorkflows.filter(
    w => COMPASS_EXEMPT.includes(w.name)
  );

  // 3.1: Vacuous pass guard
  it('at least 20 workflows have compass tables', () => {
    let compassCount = 0;
    for (const wf of nonExemptWorkflows) {
      const stepFile = findFinalStepFile(wf.dir);
      if (stepFile) {
        const content = fs.readFileSync(stepFile, 'utf8');
        if (extractCompassSection(content)) compassCount++;
      }
    }
    assert.ok(
      compassCount >= 20,
      `Expected at least 20 workflows with compass tables, found ${compassCount}`
    );
  });

  // 3.2: Per non-exempt workflow: final step has compass heading
  for (const wf of nonExemptWorkflows) {
    it(`${wf.name} (${wf.agentName}): final step has ## Vortex Compass`, () => {
      const stepFile = findFinalStepFile(wf.dir);
      assert.ok(
        stepFile,
        `${wf.name} (${wf.agentName}): no step files found in ${wf.dir}/steps/`
      );
      const content = fs.readFileSync(stepFile, 'utf8');
      const compass = extractCompassSection(content);
      assert.ok(
        compass,
        `${wf.name} (${wf.agentName}): final step ${path.basename(stepFile)} missing ## Vortex Compass section`
      );
    });
  }

  // 3.3: Per exempt workflow: confirm NO compass heading
  for (const wf of exemptWorkflows) {
    it(`${wf.name} (${wf.agentName}): exempt workflow has NO compass section`, () => {
      const stepFile = findFinalStepFile(wf.dir);
      if (!stepFile) return; // No step files — exempt is correct
      const content = fs.readFileSync(stepFile, 'utf8');
      const compass = extractCompassSection(content);
      assert.strictEqual(
        compass,
        null,
        `${wf.name} (${wf.agentName}): exempt workflow should NOT have ## Vortex Compass section but one was found`
      );
    });
  }
});

// ─── Test Suite: Compass Table Format & Routing (AC: 1,2,3,4,6,7) ──

describe('Compass Table Format & Routing Validity', () => {
  const nonExemptWorkflows = allWorkflows.filter(
    w => !COMPASS_EXEMPT.includes(w.name)
  );

  for (const wf of nonExemptWorkflows) {
    describe(`${wf.name} (${wf.agentName})`, () => {
      let compass = null;
      let parsed = null;

      // Load compass data once per workflow (try-catch so tests fail gracefully)
      const stepFile = findFinalStepFile(wf.dir);
      try {
        if (stepFile) {
          const content = fs.readFileSync(stepFile, 'utf8');
          compass = extractCompassSection(content);
          if (compass) parsed = parseCompassTable(compass);
        }
      } catch (_) { /* compass/parsed remain null — tests will fail with diagnostics */ }

      // 4.1: 4-column headers match expected (case-insensitive)
      it('compass table has correct 4-column headers', () => {
        assert.ok(parsed, `${wf.name}: no valid compass table found`);
        const expectedHeaders = [
          'if you learned...',
          'consider next...',
          'agent',
          'why',
        ];
        const actualHeaders = parsed.headers.map(h => h.toLowerCase());
        assert.deepStrictEqual(
          actualHeaders,
          expectedHeaders,
          `${wf.name} (${wf.agentName}): compass table headers mismatch — expected ${JSON.stringify(expectedHeaders)}, got ${JSON.stringify(actualHeaders)}`
        );
      });

      // 4.2: 2-8 data rows (complex workflows like proof-of-concept/proof-of-value
      // legitimately have more exit paths than simpler workflows)
      it('compass table has 2-8 data rows', () => {
        assert.ok(parsed, `${wf.name}: no valid compass table found`);
        assert.ok(
          parsed.rows.length >= 2 && parsed.rows.length <= 8,
          `${wf.name} (${wf.agentName}): compass table should have 2-8 rows, found ${parsed.rows.length}`
        );
      });

      // 4.3: Footer contains "evidence-based recommendations"
      it('compass section has evidence-based recommendations footer', () => {
        assert.ok(compass, `${wf.name}: no compass section found`);
        assert.ok(
          parsed && parsed.hasFooter,
          `${wf.name} (${wf.agentName}): compass section missing footer with "evidence-based recommendations"`
        );
      });

      // 4.4: Agent references match registered agents
      it('all agent references match registered agents', () => {
        assert.ok(parsed, `${wf.name}: no valid compass table found`);
        for (let i = 0; i < parsed.rows.length; i++) {
          const row = parsed.rows[i];
          const agentRef = extractAgentName(row.agent);
          assert.ok(
            agentRef && agentNameMap.has(agentRef),
            `${wf.name} (${wf.agentName}): compass row ${i + 1} references unknown agent '${agentRef}' — registered: [${[...agentNameMap.keys()].join(', ')}]`
          );
        }
      });

      // 4.5: Workflow references match registered workflows
      it('all workflow references match registered workflows', () => {
        assert.ok(parsed, `${wf.name}: no valid compass table found`);
        for (let i = 0; i < parsed.rows.length; i++) {
          const row = parsed.rows[i];
          const wfRef = row.workflow.trim().toLowerCase();
          assert.ok(
            registeredWorkflowNames.has(wfRef),
            `${wf.name} (${wf.agentName}): compass row ${i + 1} references unknown workflow '${wfRef}' — registered: [${[...registeredWorkflowNames].join(', ')}]`
          );
        }
      });
    });
  }
});

// ─── Test Suite: Cross-Reference Integrity (AC: 1, 2, 3, 5) ────

describe('Cross-Reference Integrity', () => {
  // 5.1: Vacuous pass guard — routing reference exists
  it('compass-routing-reference.md exists and is non-empty', () => {
    assert.ok(
      fs.existsSync(COMPASS_REF),
      `compass-routing-reference.md not found at ${COMPASS_REF}`
    );
    const content = fs.readFileSync(COMPASS_REF, 'utf8');
    assert.ok(
      content.trim().length > 0,
      'compass-routing-reference.md exists but is empty'
    );
  });

  // 5.2: Reference mentions all 7 agent short names
  it('compass routing reference mentions all registered agent names', () => {
    const content = fs.readFileSync(COMPASS_REF, 'utf8').toLowerCase();
    for (const [agentName] of agentNameMap) {
      assert.ok(
        content.includes(agentName),
        `compass-routing-reference.md does not mention agent '${agentName}' — registered agents: [${[...agentNameMap.keys()].join(', ')}]`
      );
    }
  });

  // 5.3: Reference mentions all 22 workflow names
  it('compass routing reference mentions all registered workflow names', () => {
    const content = fs.readFileSync(COMPASS_REF, 'utf8').toLowerCase();
    const missing = [];
    for (const wfName of registeredWorkflowNames) {
      if (!content.includes(wfName.toLowerCase())) {
        missing.push(wfName);
      }
    }
    assert.strictEqual(
      missing.length,
      0,
      `compass-routing-reference.md missing ${missing.length} workflow(s): [${missing.join(', ')}] — total registered: ${registeredWorkflowNames.size}`
    );
  });

  // 5.4: Per agent — all workflowDirs exist as filesystem directories
  for (const agent of agents) {
    for (let i = 0; i < agent.workflowDirs.length; i++) {
      const wfDir = agent.workflowDirs[i];
      const wfName = agent.workflowNames[i];
      it(`${agent.name}: workflow directory exists for '${wfName}'`, () => {
        assert.ok(
          fs.existsSync(wfDir) && fs.statSync(wfDir).isDirectory(),
          `${agent.name} (${agent.id}): registry says workflow '${wfName}' exists but directory not found at ${wfDir}`
        );
      });
    }
  }

  // 5.5: Per workflow with compass — routing targets reference at least one different agent's workflow
  const nonExemptWorkflows = allWorkflows.filter(
    w => !COMPASS_EXEMPT.includes(w.name)
  );

  for (const wf of nonExemptWorkflows) {
    it(`${wf.name} (${wf.agentName}): compass routes to at least one different agent's workflow`, () => {
      const stepFile = findFinalStepFile(wf.dir);
      assert.ok(stepFile, `${wf.name}: no step files found`);
      const content = fs.readFileSync(stepFile, 'utf8');
      const compass = extractCompassSection(content);
      assert.ok(compass, `${wf.name}: no compass section found`);
      const parsed = parseCompassTable(compass);
      assert.ok(parsed, `${wf.name}: could not parse compass table`);

      const ownerAgent = wf.agentName.toLowerCase();
      const hasCrossAgentRoute = parsed.rows.some(row => {
        const targetAgent = extractAgentName(row.agent);
        return targetAgent && targetAgent !== ownerAgent;
      });

      assert.ok(
        hasCrossAgentRoute,
        `${wf.name} (${wf.agentName}): compass table only routes to own agent — expected at least one cross-agent route`
      );
    });
  }
});
