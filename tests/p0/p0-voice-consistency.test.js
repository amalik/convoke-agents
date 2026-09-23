'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  discoverAgents,
  STEP_PATTERN,
} = require('./helpers');

// ─── Voice Markers — Per-Agent Vocabulary Constants (Task 2) ────
// Domain vocabulary: verified in workflow step files. Keyed by agent ID for
// dynamic lookup via discoverAgents().
//
// The `phrases` half of this table is gone (T140, 2026-09-23). It backed three
// cross-validation tests that asked whether registry and agent file shared at
// least one signature phrase or keyword — which two fully diverged personas
// passed, and six drifted agents did. Persona agreement is now an exact
// relation over every registered agent, Gyre and bme included, in
// `tests/unit/agent-persona-registry-sync.test.js`. Do not re-add phrases
// here: widening the table makes this gate harder to pass without making it
// able to detect drift.

const VOICE_MARKERS = {
  'contextualization-expert': {
    vocabulary: ['persona', 'hypothesis', 'assumption', 'context', 'problem', 'product', 'vision'],
  },
  'discovery-empathy-expert': {
    vocabulary: ['empathy', 'observe', 'discover', 'interview', 'user', 'research', 'feelings'],
  },
  'research-convergence-specialist': {
    vocabulary: ['converge', 'synthesize', 'pattern', 'insight', 'evidence', 'research', 'finding'],
  },
  'hypothesis-engineer': {
    vocabulary: ['hypothesis', 'assumption', 'brainwriting', 'falsifiable', 'belief', 'experiment'],
  },
  'lean-experiments-specialist': {
    vocabulary: ['experiment', 'assumption', 'measure', 'MVP', 'lean', 'learning', 'evidence'],
  },
  'production-intelligence-specialist': {
    vocabulary: ['signal', 'pattern', 'observe', 'behavior', 'metric', 'anomaly', 'data'],
  },
  'learning-decision-expert': {
    vocabulary: ['evidence', 'decision', 'pivot', 'learning', 'data', 'action', 'experiment'],
  },
};

// ─── Dynamic Agent Discovery (NFR5) ────────────────────────────
const agents = discoverAgents();

// The registry-vs-agent-file half of this file is gone (T140). Persona agreement is an exact
// relation in `tests/unit/agent-persona-registry-sync.test.js`, over all 12 registered agents
// rather than the 7 this suite discovers, and it runs in `npm test` as well as CI's coverage job.
// The "all 4 persona fields non-empty" check that stood here duplicated
// `tests/unit/agent-registry.test.js` exactly, for the same agents, so it went with it.

// ─── P0 Voice Consistency: Workflow Step Voice Markers ───────────

describe('P0 Voice Consistency: Workflow Step Voice Markers (Low-Confidence)', () => {
  for (const agent of agents) {
    describe(`${agent.name} (${agent.id})`, () => {
      it('workflow step content contains domain vocabulary', (t) => {
        const markers = VOICE_MARKERS[agent.id];
        if (!markers) {
          t.skip(`No voice markers defined for ${agent.name} — add to VOICE_MARKERS`);
          return;
        }

        // M2: Vacuous pass guard — agent has workflows
        assert.ok(
          agent.workflowDirs.length >= 1,
          `[Low-Confidence] ${agent.name} (${agent.id}): expected at least 1 workflow, found ${agent.workflowDirs.length} (human spot-check recommended)`
        );

        // Concatenate ALL step files across ALL workflows for this agent
        let allStepContent = '';
        let totalStepFiles = 0;

        for (const wfDir of agent.workflowDirs) {
          const stepsDir = path.join(wfDir, 'steps');
          if (!fs.existsSync(stepsDir)) continue;

          const files = fs.readdirSync(stepsDir)
            .filter(f => STEP_PATTERN.test(f))
            .sort();

          for (const file of files) {
            allStepContent += fs.readFileSync(path.join(stepsDir, file), 'utf8') + '\n';
            totalStepFiles++;
          }
        }

        // M2: Vacuous pass guard — ensure step files exist
        assert.ok(
          totalStepFiles >= 1,
          `[Low-Confidence] ${agent.name} (${agent.id}): expected step files but found ${totalStepFiles} across ${agent.workflowDirs.length} workflows (human spot-check recommended)`
        );

        const contentLower = allStepContent.toLowerCase();
        const matchedWords = markers.vocabulary.filter(
          word => contentLower.includes(word.toLowerCase())
        );

        assert.ok(
          matchedWords.length >= 2,
          `[Low-Confidence] ${agent.name} (${agent.id}): workflow step content should contain at least 2 domain vocabulary words from [${markers.vocabulary.join(', ')}], found ${matchedWords.length}: [${matchedWords.join(', ')}] (human spot-check recommended)`
        );
      });
    });
  }
});
