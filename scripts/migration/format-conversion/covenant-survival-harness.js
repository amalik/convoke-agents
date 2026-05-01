'use strict';

/**
 * @module scripts/migration/format-conversion/covenant-survival-harness
 *
 * Covenant audit re-runner for I97 per-agent conversions. Implements the
 * cell-level non-regression rule (NFR7 / FR17–20) per ADR-003 verification
 * harness architecture and ADR-005 baseline-validity policy.
 *
 * **Per-Right matrix is authored at Story 4.1 (Epic 4).** ADR-005 declares
 * the per-Right (OC-R1..R7) decision policy; this harness consumes the
 * matrix as input but does NOT define it. ADR-005 transitions
 * `proposed → accepted` when Story 4.1 lands the matrix.
 *
 * Until Story 4.1: the harness accepts a matrix-shaped object and:
 *   - For Rights marked 'declare-valid': records `cellResults[cell-id] =
 *     'declared-valid-by-matrix'` with the matrix's rationale string.
 *   - For Rights marked 're-audit': records `cellResults[cell-id] =
 *     'pending-execution'`. Full re-audit logic (running each cell's check
 *     against the converted source) is authored at Story 4.2.
 *
 * If `perRightMatrix` is undefined or empty, the harness returns
 * `{ status: 'no-matrix-supplied' }` per AC6 — no throw.
 *
 * The `tmpDir` parameter is **reserved for Story 4.2's full re-audit logic**
 * (per-cell isolated execution per `test-fixture-isolation`). In this
 * story's stub, the parameter is accepted but unused. Story 4.2 inherits
 * this contract.
 *
 * Authored by: Story i97-1.1 (Migration Tooling Foundation Scaffolded).
 * Derives from: ADR-003, ADR-005.
 * Consumers:
 *   - Story 4.1 (per-Right matrix authoring) — supplies the matrix
 *   - Story 4.2 (Covenant cell re-audit execution) — extends the stub
 *   - Per-agent stories with Covenant cells (Stories 2.1–2.7)
 *
 * Reusable for I98 (Gyre) and I99 (Team Factory) per NFR18.
 */

const fs = require('fs-extra');

// Operator Rights enumerated. Source of truth: convoke-covenant-operator.md
// + convoke-spec-covenant-compliance-checklist.md. Frozen so consumers
// can't mutate (Round 2 review patch R2-P9 — consistency with sibling
// ROLE_TO_FIRSTNAME_REGISTRY in personality-harness).
const OPERATOR_RIGHTS = Object.freeze(['OC-R1', 'OC-R2', 'OC-R3', 'OC-R4', 'OC-R5', 'OC-R6', 'OC-R7']);

const MATRIX_DECISION_RE_AUDIT = 're-audit';
const MATRIX_DECISION_DECLARE_VALID = 'declare-valid';
const VALID_MATRIX_DECISIONS = Object.freeze([MATRIX_DECISION_RE_AUDIT, MATRIX_DECISION_DECLARE_VALID]);

// Whitelist regex for agentRoleName — Round 1 review patch P1.
const AGENT_ROLE_NAME_RE = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/;

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Run the Covenant survival check for a single agent's converted source
 * against a baseline audit. Stub implementation per Story i97-1.1 AC6;
 * full per-cell execution authored at Story 4.2.
 *
 * @param {Object} options
 * @param {string} options.projectRoot         Absolute path to the project
 *                                              root.
 * @param {string} options.agentRoleName       Role-name directory of the
 *                                              agent (e.g.
 *                                              'contextualization-expert').
 * @param {string} options.baselineAuditPath   Absolute path to the baseline
 *                                              audit report (typically the
 *                                              A26 Vortex HC-cluster audit
 *                                              from 2026-04-26 or a
 *                                              predecessor).
 * @param {Object} [options.perRightMatrix]    Per-Right decision matrix per
 *                                              ADR-005, authored at Story
 *                                              4.1. Shape: an object keyed
 *                                              by 'OC-R1'..'OC-R7'; each
 *                                              value is `{ decision:
 *                                              're-audit'|'declare-valid',
 *                                              rationale: string }`.
 *                                              If absent or empty, the
 *                                              harness returns `{ status:
 *                                              'no-matrix-supplied' }`.
 * @param {string} [options.tmpDir]            **Reserved for Story 4.2.**
 *                                              In this stub, accepted but
 *                                              unused. Story 4.2 will use
 *                                              tmpDir for per-cell isolated
 *                                              execution per
 *                                              `test-fixture-isolation`
 *                                              rule.
 * @returns {{
 *   status: string,
 *   cellResults?: Object<string, string>,
 *   regressedCells?: string[],
 *   declaredValidCells?: string[],
 *   message?: string
 * }}
 */
function runCovenantSurvivalCheck(options) {
  if (!options || typeof options !== 'object') {
    throw new TypeError('runCovenantSurvivalCheck: options object is required');
  }
  const { projectRoot, agentRoleName, baselineAuditPath, perRightMatrix } = options;

  if (typeof projectRoot !== 'string' || projectRoot.length === 0) {
    throw new TypeError('runCovenantSurvivalCheck: options.projectRoot must be a non-empty string');
  }
  if (typeof agentRoleName !== 'string' || agentRoleName.length === 0) {
    throw new TypeError('runCovenantSurvivalCheck: options.agentRoleName must be a non-empty string');
  }
  // Round 1 review patch P1: agentRoleName path-traversal validation.
  if (!AGENT_ROLE_NAME_RE.test(agentRoleName)) {
    throw new TypeError(`runCovenantSurvivalCheck: options.agentRoleName must match ${AGENT_ROLE_NAME_RE.source} (got '${agentRoleName}')`);
  }
  if (typeof baselineAuditPath !== 'string' || baselineAuditPath.length === 0) {
    throw new TypeError('runCovenantSurvivalCheck: options.baselineAuditPath must be a non-empty string');
  }

  // Per AC6: if perRightMatrix absent/empty, return no-matrix-supplied.
  // Round 1 review patch P20: Array.isArray check before generic typeof
  // 'object' (arrays are objects in JS — empty array would otherwise
  // collapse to no-matrix-supplied silently).
  if (
    perRightMatrix === undefined
    || perRightMatrix === null
    || (typeof perRightMatrix === 'object' && !Array.isArray(perRightMatrix) && Object.keys(perRightMatrix).length === 0)
  ) {
    return {
      status: 'no-matrix-supplied',
      message: 'Per-Right matrix authored at Story 4.1; supply matrix to run survival check',
    };
  }

  if (typeof perRightMatrix !== 'object' || Array.isArray(perRightMatrix)) {
    throw new TypeError('runCovenantSurvivalCheck: options.perRightMatrix must be a plain object keyed by OC-R1..OC-R7 (arrays not accepted)');
  }

  // Validate matrix shape: every key must be a known Right; every value must
  // have a valid decision.
  for (const right of Object.keys(perRightMatrix)) {
    if (!OPERATOR_RIGHTS.includes(right)) {
      throw new Error(`runCovenantSurvivalCheck: perRightMatrix contains unknown right '${right}' — expected one of ${OPERATOR_RIGHTS.join(', ')}`);
    }
    const entry = perRightMatrix[right];
    if (!entry || typeof entry !== 'object' || !VALID_MATRIX_DECISIONS.includes(entry.decision)) {
      throw new Error(`runCovenantSurvivalCheck: perRightMatrix['${right}'] must be { decision: 're-audit'|'declare-valid', rationale: string }`);
    }
  }

  // Verify baseline audit exists AND is a regular file (Round 1 review
  // patch P26 — directory paths previously passed `existsSync` check and
  // would fail later when Story 4.2 tries to parse a directory as
  // markdown).
  if (!fs.existsSync(baselineAuditPath)) {
    return {
      status: 'baseline-audit-missing',
      message: `Baseline audit report not found at ${baselineAuditPath}`,
    };
  }
  if (!fs.statSync(baselineAuditPath).isFile()) {
    return {
      status: 'baseline-audit-not-a-file',
      message: `Baseline audit path exists but is not a regular file: ${baselineAuditPath}`,
    };
  }

  // Stub: scaffold the cell-iteration shell. Story 4.2 implements the
  // per-cell check logic.
  const cellResults = {};
  const regressedCells = [];
  const declaredValidCells = [];

  for (const right of OPERATOR_RIGHTS) {
    const matrixEntry = perRightMatrix[right];
    if (!matrixEntry) {
      // Right not yet covered by matrix — Story 4.1 must ensure all 7 are
      // present. Until then, mark as pending.
      cellResults[right] = 'pending-matrix-entry';
      continue;
    }
    if (matrixEntry.decision === MATRIX_DECISION_DECLARE_VALID) {
      cellResults[right] = `declared-valid-by-matrix: ${matrixEntry.rationale || '(no rationale supplied)'}`;
      declaredValidCells.push(right);
    } else if (matrixEntry.decision === MATRIX_DECISION_RE_AUDIT) {
      cellResults[right] = 'pending-execution';
      // Story 4.2 will populate regressedCells based on actual cell-by-cell
      // pre/post comparison. Stub leaves the array empty.
    }
  }

  return {
    status: 'matrix-applied',
    cellResults,
    regressedCells,
    declaredValidCells,
    message: `Stub execution complete. Story 4.2 implements the per-cell re-audit logic. Matrix applied for agent '${agentRoleName}' against baseline '${baselineAuditPath}'.`,
  };
}

module.exports = {
  runCovenantSurvivalCheck,
  // Constants exposed for Story 4.1 / 4.2 reuse + tests.
  OPERATOR_RIGHTS,
  MATRIX_DECISION_RE_AUDIT,
  MATRIX_DECISION_DECLARE_VALID,
};
