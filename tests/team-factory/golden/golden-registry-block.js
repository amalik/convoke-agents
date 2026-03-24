// ── Test Team Module ────────────────────────────────────────────────
const TEST_TEAM_AGENTS = [
  {
    id: 'alpha-analyzer', name: 'Alpha', icon: '\u{2699}',
    title: 'Analyzes data patterns', stream: 'test-team',
    persona: {
      role: 'Analyzes data patterns',
      identity: 'Test agent',
      communication_style: 'Direct',
      expertise: 'Testing',
    },
  },
  {
    id: 'beta-builder', name: 'Beta', icon: '\u{2699}',
    title: 'Builds software components', stream: 'test-team',
    persona: {
      role: 'Builds software components',
      identity: 'Test agent',
      communication_style: 'Direct',
      expertise: 'Testing',
    },
  },
];

const TEST_TEAM_WORKFLOWS = [
  { name: 'data-analysis', agent: 'alpha-analyzer' },
  { name: 'component-building', agent: 'beta-builder' },
];

// Derived lists for Test Team
const TEST_TEAM_AGENT_FILES = TEST_TEAM_AGENTS.map(a => `${a.id}.md`);
const TEST_TEAM_AGENT_IDS = TEST_TEAM_AGENTS.map(a => a.id);
const TEST_TEAM_WORKFLOW_NAMES = TEST_TEAM_WORKFLOWS.map(w => w.name);
