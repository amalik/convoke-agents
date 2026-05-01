'use strict';

/**
 * @module scripts/migration/format-conversion/personality-harness
 *
 * Personality verification harness for I97 per-agent conversions. Implements
 * FR21–23 per ADR-003 (verification harness architecture).
 *
 * Authored by: Story i97-1.1 (Migration Tooling Foundation Scaffolded).
 * Round 1 code-review patches applied 2026-05-01: agentRoleName path-
 * traversal validation; UTF-8 BOM stripping before JSON.parse;
 * fingerprint-extraction code-fence stripping + off-by-one fix; role→
 * firstname registry extracted from inline literal; mode-validation throw
 * authorized under broadened AC7 structural-input fail-fast pattern (D2);
 * environmental fail-fast on corrupt JSON authorized under same pattern
 * (D3 paired with D2).
 *
 * Consumes:
 *   - The calibrated rubric at `_bmad-output/planning-artifacts/
 *     convoke-spec-personality-preservation-rubric.md`
 *     (status: `calibrated` since 2026-04-29).
 *   - Existing baseline fixtures at `tests/migration/personality-preservation/
 *     fixtures/<agent-role>/baseline-fixed-prompt.json` and
 *     `baseline-unscripted-scenario.md`.
 *
 * Produces:
 *   - In `mode: 'capture'`: an `operatorScoringPrompt` string formatted from
 *     the rubric's 7 dimensions + the per-agent personality fingerprint.
 *   - In `mode: 'verify'`: a per-dimension scoring framework that the
 *     operator fills in. **The harness does NOT do automated personality
 *     scoring.** Operator judgment is the rubric's authoritative consumer
 *     per FR23 disconfirmation threshold.
 *
 * Reusable for I98 (Gyre) and I99 (Team Factory) per NFR18 — extend
 * `ROLE_TO_FIRSTNAME_REGISTRY` below with the new agent mappings; the
 * dimension structure and scoring scale are migration-general.
 */

const fs = require('fs-extra');
const path = require('path');

const FIXTURE_FIXED_PROMPT = 'baseline-fixed-prompt.json';
const FIXTURE_UNSCRIPTED_SCENARIO = 'baseline-unscripted-scenario.md';

const VALID_MODES = ['capture', 'verify'];

// Whitelist regex for agentRoleName — prevents path traversal via `..`,
// path separators, etc. (Round 1 review patch P1.)
const AGENT_ROLE_NAME_RE = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/;

/**
 * Role-name → first-name registry. Source of truth: rubric § "Per-Agent
 * Personality Fingerprints" subsection headers (which use first names).
 *
 * Extended for I98 (Gyre) and I99 (Team Factory) by adding entries to this
 * registry — no other code change needed (Round 1 review patch P22 — was
 * previously hardcoded inline; surfaced as a registry for NFR18 reuse).
 */
const ROLE_TO_FIRSTNAME_REGISTRY = Object.freeze({
  // Vortex (I97)
  'contextualization-expert': 'Emma',
  'discovery-empathy-expert': 'Isla',
  'research-convergence-specialist': 'Mila',
  'hypothesis-engineer': 'Liam',
  'lean-experiments-specialist': 'Wade',
  'production-intelligence-specialist': 'Noah',
  'learning-decision-expert': 'Max',
  // Gyre (I98), Team Factory (I99): extend here when those migrations fire.
});

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Run the personality verification harness for a single agent.
 *
 * Path-safety note (Round 1 review patch P1): `agentRoleName` is validated
 * against AGENT_ROLE_NAME_RE before any path.join.
 *
 * @param {Object} options
 * @param {string} options.projectRoot      Absolute path to the project root.
 * @param {string} options.agentRoleName    Role-name directory of the agent
 *                                           (must match
 *                                           `/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/`).
 * @param {string} options.fixtureRoot      Absolute path to the fixture
 *                                           root dir.
 * @param {string} options.rubricPath       Absolute path to the calibrated
 *                                           rubric markdown file.
 * @param {string} options.mode             'capture' or 'verify'. Any other
 *                                           value throws (per AC7
 *                                           structural-input fail-fast
 *                                           pattern).
 * @returns {{
 *   mode: string,
 *   agentRoleName: string,
 *   fixedPromptCapture: ?Object,
 *   scenarioCapture: ?string,
 *   operatorScoringPrompt: ?string,
 *   perDimensionFramework: ?Object
 * }}
 */
function runPersonalityCheck(options) {
  if (!options || typeof options !== 'object') {
    throw new TypeError('runPersonalityCheck: options object is required');
  }
  const { projectRoot, agentRoleName, fixtureRoot, rubricPath, mode } = options;

  // Mode validation — authorized throw per AC7 structural-input fail-fast
  // pattern (broadened in Round 1 review decision D2).
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`Invalid mode: expected 'capture' or 'verify', got '${mode}'`);
  }

  if (typeof projectRoot !== 'string' || projectRoot.length === 0) {
    throw new TypeError('runPersonalityCheck: options.projectRoot must be a non-empty string');
  }
  if (typeof agentRoleName !== 'string' || agentRoleName.length === 0) {
    throw new TypeError('runPersonalityCheck: options.agentRoleName must be a non-empty string');
  }
  if (!AGENT_ROLE_NAME_RE.test(agentRoleName)) {
    throw new TypeError(`runPersonalityCheck: options.agentRoleName must match ${AGENT_ROLE_NAME_RE.source} (got '${agentRoleName}')`);
  }
  if (typeof fixtureRoot !== 'string' || fixtureRoot.length === 0) {
    throw new TypeError('runPersonalityCheck: options.fixtureRoot must be a non-empty string');
  }
  if (typeof rubricPath !== 'string' || rubricPath.length === 0) {
    throw new TypeError('runPersonalityCheck: options.rubricPath must be a non-empty string');
  }

  // Read the agent's baseline fixtures.
  const fixedPromptPath = path.join(fixtureRoot, agentRoleName, FIXTURE_FIXED_PROMPT);
  const scenarioPath = path.join(fixtureRoot, agentRoleName, FIXTURE_UNSCRIPTED_SCENARIO);

  let fixedPromptCapture = null;
  let scenarioCapture = null;

  if (fs.existsSync(fixedPromptPath)) {
    let raw = fs.readFileSync(fixedPromptPath, 'utf8');
    // Round 1 review patch P19: strip UTF-8 BOM before JSON.parse.
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    try {
      fixedPromptCapture = JSON.parse(raw);
    } catch (err) {
      // Authorized environmental fail-fast (Round 1 review decision D3
      // paired with D2).
      throw new Error(
        `runPersonalityCheck: failed to parse fixed-prompt fixture at ${fixedPromptPath}: ${err.message}`,
        { cause: err },
      );
    }
  }

  if (fs.existsSync(scenarioPath)) {
    scenarioCapture = fs.readFileSync(scenarioPath, 'utf8');
  }

  if (!fs.existsSync(rubricPath)) {
    throw new Error(`runPersonalityCheck: rubric not found at ${rubricPath}`);
  }
  const rubricContent = fs.readFileSync(rubricPath, 'utf8');

  if (mode === 'capture') {
    const operatorScoringPrompt = formatOperatorScoringPrompt({
      rubricContent,
      agentRoleName,
      hasFixedPromptCapture: fixedPromptCapture !== null,
      hasScenarioCapture: scenarioCapture !== null,
    });
    return {
      mode: 'capture',
      agentRoleName,
      fixedPromptCapture,
      scenarioCapture,
      operatorScoringPrompt,
      perDimensionFramework: null,
    };
  }

  // mode === 'verify'
  const perDimensionFramework = buildPerDimensionFramework({ agentRoleName });

  return {
    mode: 'verify',
    agentRoleName,
    fixedPromptCapture,
    scenarioCapture,
    operatorScoringPrompt: null,
    perDimensionFramework,
  };
}

// ─── Internal helpers ───────────────────────────────────────────────

/**
 * Build the operator scoring prompt — a markdown-formatted string showing
 * the 7 dimensions + the per-agent personality fingerprint pulled from the
 * rubric.
 */
function formatOperatorScoringPrompt({ rubricContent, agentRoleName, hasFixedPromptCapture, hasScenarioCapture }) {
  const fingerprintSection = extractPerAgentFingerprint(rubricContent, agentRoleName);

  const lines = [
    `# Personality Preservation Operator Scoring Prompt — ${agentRoleName}`,
    '',
    '## Available capture data',
    '',
    `- Fixed-prompt baseline: ${hasFixedPromptCapture ? '✓ available' : '✗ not found'}`,
    `- Unscripted scenario baseline: ${hasScenarioCapture ? '✓ available' : '✗ not found'}`,
    '',
    '## Per-agent personality fingerprint (from rubric)',
    '',
    fingerprintSection || '(Fingerprint section not found for this agent — verify rubric § "Per-Agent Personality Fingerprints" includes an entry for this role.)',
    '',
    '## Scoring task',
    '',
    'Score the post-migration agent against each of the 7 dimensions (D1–D7) defined in the rubric.',
    'For each dimension, provide a score 1–4 with a 1-sentence evidence citation.',
    '',
    '**Disconfirmation threshold (FR23):** any dimension at score 1 (Degraded) blocks merge regardless of other scores.',
    '',
    '## Reviewer cues to apply (per rubric § "Status")',
    '',
    '1. Meta-pattern awareness — all 7 agents demonstrate this; verify the converted agent retains it.',
    '2. Operator-preference vs principle-violation — lean response style ≠ degraded principle adherence.',
    '3. Intellectual honesty as D3 (Liam-specific cue — Bayesian concession).',
    '4. Meta-system Vortex-role-split awareness (Noah-specific cue — refusing-to-prescribe is the principle).',
    '5. Wade\'s pedagogical adaptive-rigor under pressure.',
    '6. Mila\'s bias-naming under deadline pressure.',
    '7. Isla\'s progressive-discovery ladder under constraint.',
    '',
    'See the rubric for the full dimension definitions and scoring scale.',
  ];

  return lines.join('\n');
}

/**
 * Build a per-dimension scoring framework for `mode: 'verify'`. The
 * operator fills in scores; we don't auto-score (per FR23: operator
 * judgment is authoritative).
 *
 * Round 1 review patch P15: removed dead args (`rubricContent`,
 * `fixedPromptCapture`, `scenarioCapture`, `postMigrationCapture`) from
 * the callsite. The 'verify' mode produces a dimension framework; the
 * actual capture comparison + scoring is operator work, not harness work.
 */
function buildPerDimensionFramework({ agentRoleName }) {
  const dimensions = [
    'D1-role-conveyance',
    'D2-communication-style',
    'D3-principle-adherence',
    'D4-conversational-signals',
    'D5-failure-handling',
    'D6-cross-turn-coherence',
    'D7-output-format-consistency',
  ];

  const framework = { agent: agentRoleName, dimensions: {} };
  for (const dim of dimensions) {
    framework.dimensions[dim] = {
      score: null,
      evidence: '',
      verdict: null,
    };
  }
  framework.overallScore = null;
  framework.shipDecision = null;
  return framework;
}

/**
 * Extract the per-agent fingerprint section from the rubric markdown.
 *
 * Round 1 review patches:
 *   - P14: strip code fences before regex match (so `### <Name>` inside a
 *     fenced code block doesn't trigger as a section header).
 *   - P13: off-by-one fix — search for next `###` strictly after the
 *     header line (not from start of remainder), so a blank section
 *     immediately followed by another `###` returns the (empty) body
 *     correctly rather than collapsing to just the header.
 */
function extractPerAgentFingerprint(rubricContent, agentRoleName) {
  const firstName = ROLE_TO_FIRSTNAME_REGISTRY[agentRoleName];
  if (!firstName) return null;

  // Strip code fences before searching for the section header.
  const stripped = stripCodeFences(rubricContent);

  // Round 2 review patch R2-P5: escape regex special chars in firstName
  // before interpolation. Defends against future registry entries with
  // names containing regex meta-chars (e.g., a hypothetical 'A.J.' or a
  // hyphenated name) that would silently break the pattern.
  const escapedFirstName = firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headerPattern = new RegExp(`^###\\s+${escapedFirstName}\\b[^\\n]*$`, 'm');
  const headerMatch = stripped.match(headerPattern);
  if (!headerMatch) return null;

  const headerEnd = headerMatch.index + headerMatch[0].length;
  // Search for the next `###` STRICTLY AFTER the header line (P13: don't
  // collapse on adjacent `###` lines).
  const remainder = stripped.slice(headerEnd);
  // Skip past the header's trailing newline before searching.
  const afterNewline = remainder.replace(/^\r?\n/, '');
  const newlineSkipLen = remainder.length - afterNewline.length;
  const nextHeaderRe = /^###\s+/m;
  const nextHeaderMatch = afterNewline.match(nextHeaderRe);

  // Slice the original (non-stripped) content so the returned text retains
  // any prose that was inside fences (we only used stripped for boundary
  // detection).
  const originalEndOffset = headerEnd + newlineSkipLen
    + (nextHeaderMatch ? nextHeaderMatch.index : afterNewline.length);
  return rubricContent.slice(headerMatch.index, originalEndOffset).trim();
}

/**
 * Strip fenced code blocks (```/~~~) and inline code spans (`...`) from
 * markdown content. Preserves line + column positions via space-fill.
 */
function stripCodeFences(content) {
  const fenceRe = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
  const noFences = content.replace(fenceRe, (m) => m.replace(/[^\n]/g, ' '));
  const inlineRe = /`[^`\n]*`/g;
  return noFences.replace(inlineRe, (m) => ' '.repeat(m.length));
}

module.exports = {
  runPersonalityCheck,
  // Exported for testability + I98/I99 reuse extension.
  ROLE_TO_FIRSTNAME_REGISTRY,
};
