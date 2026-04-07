const { applyFrontmatterRule } = require('../../scripts/lib/portfolio/rules/frontmatter-rule');
const { applyArtifactChainRule, isEpicDone, detectHCChain, collectPhaseEvidence } = require('../../scripts/lib/portfolio/rules/artifact-chain-rule');
const { applyConflictResolver, deriveNextAction, comparePhasePriority } = require('../../scripts/lib/portfolio/rules/conflict-resolver');

// Helper: create empty InitiativeState
function makeState(initiative = 'test') {
  return {
    initiative,
    phase: { value: null, source: null, confidence: null },
    status: { value: null, source: null, confidence: null },
    lastArtifact: { file: null, date: null },
    nextAction: { value: null, source: null }
  };
}

// --- frontmatter-rule tests ---

describe('frontmatter-rule', () => {
  test('reads explicit status from frontmatter', () => {
    const state = makeState();
    const artifacts = [{ filename: 'gyre-prd.md', frontmatter: { status: 'validated' } }];
    const result = applyFrontmatterRule(state, artifacts);
    expect(result.status.value).toBe('validated');
    expect(result.status.source).toBe('frontmatter');
    expect(result.status.confidence).toBe('explicit');
  });

  test('reads explicit phase from frontmatter (operator override)', () => {
    const state = makeState();
    const artifacts = [{ filename: 'gyre-prd.md', frontmatter: { phase: 'build' } }];
    const result = applyFrontmatterRule(state, artifacts);
    expect(result.phase.value).toBe('build');
    expect(result.phase.confidence).toBe('explicit');
  });

  test('no frontmatter status -> state unchanged', () => {
    const state = makeState();
    const artifacts = [{ filename: 'gyre-prd.md', frontmatter: { initiative: 'gyre' } }];
    const result = applyFrontmatterRule(state, artifacts);
    expect(result.status.value).toBeNull();
    expect(result.phase.value).toBeNull();
  });

  test('no frontmatter at all -> state unchanged', () => {
    const state = makeState();
    const artifacts = [{ filename: 'gyre-prd.md' }];
    const result = applyFrontmatterRule(state, artifacts);
    expect(result.status.value).toBeNull();
  });

  test('first explicit value wins (most recent first)', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'a.md', frontmatter: { status: 'validated' } },
      { filename: 'b.md', frontmatter: { status: 'draft' } }
    ];
    const result = applyFrontmatterRule(state, artifacts);
    expect(result.status.value).toBe('validated');
  });

  test('empty-string status treated as absent (not explicit)', () => {
    const state = makeState();
    const artifacts = [{ filename: 'a.md', frontmatter: { status: '' } }];
    const result = applyFrontmatterRule(state, artifacts);
    expect(result.status.value).toBeNull();
  });

  test('empty-string phase treated as absent', () => {
    const state = makeState();
    const artifacts = [{ filename: 'a.md', frontmatter: { phase: '' } }];
    const result = applyFrontmatterRule(state, artifacts);
    expect(result.phase.value).toBeNull();
  });

  test('does not override existing explicit status', () => {
    const state = makeState();
    state.status = { value: 'active', source: 'frontmatter', confidence: 'explicit' };
    const artifacts = [{ filename: 'a.md', frontmatter: { status: 'draft' } }];
    const result = applyFrontmatterRule(state, artifacts);
    expect(result.status.value).toBe('active');
  });
});

// --- artifact-chain-rule tests ---

describe('artifact-chain-rule', () => {
  test('epic with status-context done -> phase: complete', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-epic.md', type: 'epic', content: 'epic-1: done\nepic-2: done' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('complete');
    expect(result.phase.source).toBe('artifact-chain');
  });

  test('epic with ✅ marker -> phase: complete', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-epic.md', type: 'epic', content: '## Status: ✅ All stories delivered' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('complete');
  });

  test('epic with [x] marker -> phase: complete', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-epic.md', type: 'epic', content: '- [x] All stories' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('complete');
  });

  test('epic with strikethrough -> phase: complete', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-epic.md', type: 'epic', content: '~~This epic is finished~~' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('complete');
  });

  test('epic with bold done marker -> phase: complete', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-epic.md', type: 'epic', content: '**Status:** ** done**' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('complete');
  });

  test('epic mentioning "done" in narrative context -> NOT complete (no false positive)', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-epic.md', type: 'epic', content: 'We are not done yet. Story 1 is in progress.' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).not.toBe('complete');
  });

  test('epic + sprint -> phase: build', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-epic.md', type: 'epic', content: '## Stories\n\n- story 1: in progress' },
      { filename: 'gyre-sprint.md', type: 'sprint' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('build');
  });

  test('architecture doc -> phase: planning', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-arch.md', type: 'arch' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('planning');
  });

  test('HC artifacts -> phase: discovery', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-problem-def-hc2.md', type: 'problem-def', hcPrefix: 'hc2' },
      { filename: 'gyre-hypothesis-hc3.md', type: 'hypothesis', hcPrefix: 'hc3' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('discovery');
  });

  test('PRD only -> phase: planning', () => {
    const state = makeState();
    const artifacts = [{ filename: 'gyre-prd.md', type: 'prd' }];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('planning');
  });

  test('brief only -> phase: planning', () => {
    const state = makeState();
    const artifacts = [{ filename: 'gyre-brief.md', type: 'brief' }];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('planning');
  });

  test('no recognized artifacts -> phase: unknown', () => {
    const state = makeState();
    const artifacts = [{ filename: 'random.md', type: null }];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('unknown');
  });

  test('does not override explicit frontmatter phase', () => {
    const state = makeState();
    state.phase = { value: 'build', source: 'frontmatter', confidence: 'explicit' };
    const artifacts = [{ filename: 'gyre-prd.md', type: 'prd' }];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('build');
    expect(result.phase.source).toBe('frontmatter');
  });

  test('multiple epics -> latest date used', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'gyre-epic-old.md', type: 'epic', date: '2026-01-01', content: 'done' },
      { filename: 'gyre-epic-new.md', type: 'epic', date: '2026-04-01', content: 'in progress' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    // Latest epic (2026-04-01) has "in progress" — no done marker, so falls through
    // Has epic but no sprint -> doesn't match build. Falls to next check.
    expect(result.phase.value).not.toBe('complete');
  });

  test('tracks lastArtifact from dated files', () => {
    const state = makeState();
    const artifacts = [
      { filename: 'old.md', type: 'prd', date: '2026-01-01' },
      { filename: 'new.md', type: 'prd', date: '2026-04-01' }
    ];
    applyArtifactChainRule(state, artifacts);
    expect(state.lastArtifact.file).toBe('new.md');
    expect(state.lastArtifact.date).toBe('2026-04-01');
  });
});

// --- isEpicDone ---

describe('isEpicDone', () => {
  test.each([
    ['epic-1: done', true],
    ['Status: complete', true],
    ['✅ Delivered', true],
    ['- [x] All tasks', true],
    ['~~Finished epic~~', true],
    ['** done', true],                  // bold marker
    ['epic-3: complete', true],
    ['In progress, not done yet', false], // narrative "done" is NOT a status context
    ['We are not complete', false],       // narrative "complete" is NOT a status context
    ['No status markers here', false],
    ['', false]
  ])('"%s" -> %s', (content, expected) => {
    expect(isEpicDone(content)).toBe(expected);
  });
});

// --- detectHCChain ---

describe('detectHCChain', () => {
  test('complete HC chain -> nextAction says ready', () => {
    const state = makeState();
    detectHCChain(state, new Set(['hc2', 'hc3', 'hc4', 'hc5', 'hc6']));
    expect(state.nextAction.value).toContain('complete');
  });

  test('partial chain -> nextAction shows first missing HC', () => {
    const state = makeState();
    detectHCChain(state, new Set(['hc2', 'hc3']));
    expect(state.nextAction.value).toContain('HC4');
    expect(state.nextAction.value).toContain('Experiment');
  });

  test('empty chain -> no nextAction set', () => {
    const state = makeState();
    detectHCChain(state, new Set());
    expect(state.nextAction.value).toBeNull();
  });
});

// --- git-recency-rule tests (mocked) ---

describe('git-recency-rule', () => {
  let mockExecFileSync;
  let applyGitRecencyRule;

  beforeEach(() => {
    jest.resetModules();
    const cp = require('child_process');
    mockExecFileSync = jest.spyOn(cp, 'execFileSync');
    applyGitRecencyRule = require('../../scripts/lib/portfolio/rules/git-recency-rule').applyGitRecencyRule;
  });

  afterEach(() => {
    mockExecFileSync.mockRestore();
  });

  test('recent activity -> status: ongoing', () => {
    const today = new Date().toISOString().split('T')[0];
    mockExecFileSync.mockReturnValue(today + '\n');
    const state = makeState();
    const artifacts = [{ filename: 'a.md', fullPath: '/project/a.md' }];
    const result = applyGitRecencyRule(state, artifacts, { staleDays: 30, projectRoot: '/project' });
    expect(result.status.value).toBe('ongoing');
    expect(result.status.source).toBe('git-recency');
  });

  test('old activity (>30 days) -> status: stale', () => {
    mockExecFileSync.mockReturnValue('2020-01-01\n');
    const state = makeState();
    const artifacts = [{ filename: 'a.md', fullPath: '/project/a.md' }];
    const result = applyGitRecencyRule(state, artifacts, { staleDays: 30, projectRoot: '/project' });
    expect(result.status.value).toBe('stale');
  });

  test('custom staleDays threshold', () => {
    // 10 days ago
    const d = new Date();
    d.setDate(d.getDate() - 10);
    const dateStr = d.toISOString().split('T')[0];
    mockExecFileSync.mockReturnValue(dateStr + '\n');
    const state = makeState();
    const artifacts = [{ filename: 'a.md', fullPath: '/project/a.md' }];

    // 30 days threshold -> ongoing
    let result = applyGitRecencyRule(state, artifacts, { staleDays: 30, projectRoot: '/project' });
    expect(result.status.value).toBe('ongoing');

    // 5 days threshold -> stale
    state.status = { value: null, source: null, confidence: null };
    result = applyGitRecencyRule(state, artifacts, { staleDays: 5, projectRoot: '/project' });
    expect(result.status.value).toBe('stale');
  });

  test('does not override explicit frontmatter status', () => {
    mockExecFileSync.mockReturnValue('2020-01-01\n');
    const state = makeState();
    state.status = { value: 'active', source: 'frontmatter', confidence: 'explicit' };
    const artifacts = [{ filename: 'a.md', fullPath: '/project/a.md' }];
    const result = applyGitRecencyRule(state, artifacts, { staleDays: 30, projectRoot: '/project' });
    expect(result.status.value).toBe('active');
    expect(result.status.confidence).toBe('explicit');
  });

  test('no projectRoot -> state unchanged', () => {
    const state = makeState();
    const artifacts = [{ filename: 'a.md', fullPath: '/project/a.md' }];
    const result = applyGitRecencyRule(state, artifacts, {});
    expect(result.status.value).toBeNull();
  });

  test('multiple artifacts -> picks latest date', () => {
    const today = new Date().toISOString().split('T')[0];
    let callCount = 0;
    mockExecFileSync.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? '2020-01-01\n' : today + '\n';
    });
    const state = makeState();
    const artifacts = [
      { filename: 'old.md', fullPath: '/project/old.md' },
      { filename: 'new.md', fullPath: '/project/new.md' }
    ];
    const result = applyGitRecencyRule(state, artifacts, { staleDays: 30, projectRoot: '/project' });
    expect(result.status.value).toBe('ongoing');
    expect(result.lastArtifact.file).toBe('new.md');
  });

  test('empty artifacts array -> state unchanged', () => {
    const state = makeState();
    const result = applyGitRecencyRule(state, [], { staleDays: 30, projectRoot: '/project' });
    expect(result.status.value).toBeNull();
  });

  test('git log fails -> state unchanged', () => {
    mockExecFileSync.mockImplementation(() => { throw new Error('not tracked'); });
    const state = makeState();
    const artifacts = [{ filename: 'a.md', fullPath: '/project/a.md' }];
    const result = applyGitRecencyRule(state, artifacts, { staleDays: 30, projectRoot: '/project' });
    expect(result.status.value).toBeNull();
  });
});

// --- conflict-resolver tests ---

describe('conflict-resolver', () => {
  test('ensures phase has a value when empty', () => {
    const state = makeState();
    const result = applyConflictResolver(state, []);
    expect(result.phase.value).toBe('unknown');
  });

  test('ensures status has a value when empty', () => {
    const state = makeState();
    const result = applyConflictResolver(state, []);
    expect(result.status.value).toBe('unknown');
  });

  test('derives nextAction from phase when not set', () => {
    const state = makeState();
    state.phase = { value: 'discovery', source: 'artifact-chain', confidence: 'inferred' };
    const result = applyConflictResolver(state, []);
    expect(result.nextAction.value).toContain('discovery');
  });

  test('does not override existing nextAction', () => {
    const state = makeState();
    state.nextAction = { value: 'HC4 experiment', source: 'chain-gap' };
    state.phase = { value: 'discovery', source: 'artifact-chain', confidence: 'inferred' };
    const result = applyConflictResolver(state, []);
    expect(result.nextAction.value).toBe('HC4 experiment');
  });

  test('populates lastArtifact from artifacts when missing', () => {
    const state = makeState();
    const artifacts = [{ filename: 'test.md', date: '2026-04-01' }];
    const result = applyConflictResolver(state, artifacts);
    expect(result.lastArtifact.file).toBe('test.md');
  });

  test('preserves existing lastArtifact', () => {
    const state = makeState();
    state.lastArtifact = { file: 'existing.md', date: '2026-04-05' };
    const result = applyConflictResolver(state, [{ filename: 'other.md' }]);
    expect(result.lastArtifact.file).toBe('existing.md');
  });
});

// --- deriveNextAction ---

describe('deriveNextAction', () => {
  test.each([
    ['unknown', 'Create PRD'],
    ['discovery', 'discovery'],
    ['planning', 'architecture'],
    ['build', 'story execution'],
    ['complete', 'retrospective']
  ])('phase "%s" -> action contains "%s"', (phase, expectedFragment) => {
    const state = makeState();
    state.phase = { value: phase, source: 'test', confidence: 'inferred' };
    const action = deriveNextAction(state);
    expect(action.value.toLowerCase()).toContain(expectedFragment.toLowerCase());
  });
});

// --- comparePhasePriority ---

describe('comparePhasePriority', () => {
  test('complete > build > planning > discovery > unknown', () => {
    expect(comparePhasePriority('complete', 'build')).toBeGreaterThan(0);
    expect(comparePhasePriority('build', 'planning')).toBeGreaterThan(0);
    expect(comparePhasePriority('planning', 'discovery')).toBeGreaterThan(0);
    expect(comparePhasePriority('discovery', 'unknown')).toBeGreaterThan(0);
  });

  test('same phase -> 0', () => {
    expect(comparePhasePriority('build', 'build')).toBe(0);
  });
});

// --- Story 6.3: phase evidence collection ---

describe('collectPhaseEvidence (Story 6.3)', () => {
  test('K — initiative with 3 artifacts but no PRD/arch/HC/epic → full evidence list', () => {
    const artifacts = [
      { type: 'note' },
      { type: 'note' },
      { type: 'note' }
    ];
    const types = new Set(['note']);
    const hcPrefixes = new Set();
    const evidence = collectPhaseEvidence(artifacts, types, hcPrefixes);
    expect(evidence[0]).toBe('3 artifacts found');
    expect(evidence).toContain('no PRD/brief');
    expect(evidence).toContain('no architecture');
    expect(evidence).toContain('no HC chain');
    expect(evidence).toContain('no epic');
  });

  test('L — initiative with only HC1 → incomplete HC chain marker', () => {
    const artifacts = [{ type: 'hc1', hcPrefix: 'hc1' }];
    const types = new Set(['hc1']);
    const hcPrefixes = new Set(['hc1']);
    const evidence = collectPhaseEvidence(artifacts, types, hcPrefixes);
    expect(evidence[0]).toBe('1 artifact found');
    expect(evidence).toContain('incomplete HC chain (needs HC2-HC6)');
  });

  test('Single artifact pluralization: "1 artifact found" not "1 artifacts found"', () => {
    const artifacts = [{ type: 'note' }];
    const evidence = collectPhaseEvidence(artifacts, new Set(['note']), new Set());
    expect(evidence[0]).toBe('1 artifact found');
  });

  test('applyArtifactChainRule attaches evidence on unknown phase', () => {
    const state = {
      initiative: 'test',
      phase: { value: null, source: null, confidence: null },
      status: { value: null, source: null, confidence: null },
      lastArtifact: { file: null, date: null },
      nextAction: { value: null, source: null }
    };
    const artifacts = [
      { type: 'note', filename: 'note-1.md', date: '2026-01-01' },
      { type: 'note', filename: 'note-2.md', date: '2026-01-02' }
    ];
    const result = applyArtifactChainRule(state, artifacts);
    expect(result.phase.value).toBe('unknown');
    expect(result.phase.source).toBe('artifact-chain');
    expect(Array.isArray(result.phase.evidence)).toBe(true);
    expect(result.phase.evidence[0]).toBe('2 artifacts found');
  });
});

// --- Story 6.3: conflict-resolver nextAction override ---

describe('applyConflictResolver Story 6.3 nextAction override', () => {
  test('M — initiative with zero artifacts keeps generic "Create PRD or brief" message', () => {
    const state = {
      initiative: 'empty',
      phase: { value: null, source: null, confidence: null },
      status: { value: null, source: null, confidence: null },
      lastArtifact: { file: null, date: null },
      nextAction: { value: null, source: null }
    };
    const result = applyConflictResolver(state, [], {});
    expect(result.nextAction.value).toBe('Create PRD or brief to start planning');
  });

  test('N — initiative with recognized-type artifacts but unknown phase → context-aware nextAction', () => {
    const state = {
      initiative: 'busy',
      phase: {
        value: 'unknown',
        source: 'artifact-chain',
        confidence: 'inferred',
        evidence: ['3 artifacts found', 'no PRD/brief', 'no architecture']
      },
      status: { value: null, source: null, confidence: null },
      lastArtifact: { file: null, date: null },
      nextAction: { value: null, source: null }
    };
    // At least one artifact must have a real (non-'unknown') type to trigger the override.
    // This guards against the design-intent inversion where a single fallback-attributed
    // 'unknown'-type artifact would override the legitimate "Create PRD or brief" message.
    const artifacts = [
      { filename: 'a.md', type: 'spec' },
      { filename: 'b.md', type: 'spec' },
      { filename: 'c.md', type: 'spec' }
    ];
    const result = applyConflictResolver(state, artifacts, {});
    expect(result.nextAction.value).toContain('Unknown phase:');
    expect(result.nextAction.value).toContain('3 artifacts found');
    expect(result.nextAction.value).toContain('no PRD/brief');
    // Generic fallback NOT used
    expect(result.nextAction.value).not.toBe('Create PRD or brief to start planning');
  });

  test('Override does NOT trigger when only fallback-attributed (unknown-type) artifacts exist', () => {
    // Regression guard for the design-intent inversion: if all artifacts are
    // fallback-attributed with synthetic `type: 'unknown'`, the operator should
    // still see the generic "Create PRD or brief" message.
    const state = {
      initiative: 'fallback-only',
      phase: {
        value: 'unknown',
        source: 'artifact-chain',
        confidence: 'inferred',
        evidence: ['1 artifact found', 'no PRD/brief']
      },
      status: { value: null, source: null, confidence: null },
      lastArtifact: { file: null, date: null },
      nextAction: { value: null, source: null }
    };
    const artifacts = [{ filename: 'fallback.md', type: 'unknown' }];
    const result = applyConflictResolver(state, artifacts, {});
    expect(result.nextAction.value).toBe('Create PRD or brief to start planning');
  });

  test('Override does NOT trigger when phase is known (e.g. discovery)', () => {
    const state = {
      initiative: 'forge',
      phase: { value: 'discovery', source: 'artifact-chain', confidence: 'inferred' },
      status: { value: null, source: null, confidence: null },
      lastArtifact: { file: null, date: null },
      nextAction: { value: null, source: null }
    };
    const result = applyConflictResolver(state, [{ filename: 'foo.md' }], {});
    expect(result.nextAction.value).not.toContain('Unknown phase:');
  });
});
