const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { generatePortfolio, makeEmptyState } = require('../../scripts/lib/portfolio/portfolio-engine');
const { formatTerminal } = require('../../scripts/lib/portfolio/formatters/terminal-formatter');
const { formatMarkdown } = require('../../scripts/lib/portfolio/formatters/markdown-formatter');

let projectRoot;

beforeAll(() => {
  projectRoot = findProjectRoot();
});

// --- generatePortfolio integration tests ---

describe('generatePortfolio', () => {
  test('scans real _bmad-output and returns InitiativeState array', async () => {
    const result = await generatePortfolio(projectRoot);
    expect(result.initiatives.length).toBeGreaterThan(0);
    expect(result.summary.total).toBeGreaterThan(0);
  });

  test('each initiative has phase, status, lastArtifact, nextAction', async () => {
    const result = await generatePortfolio(projectRoot);
    for (const s of result.initiatives) {
      expect(s.initiative).toBeTruthy();
      expect(s.phase).toBeDefined();
      expect(s.phase.value).toBeTruthy();
      expect(s.status).toBeDefined();
      expect(s.status.value).toBeTruthy();
      expect(s.lastArtifact).toBeDefined();
      expect(s.nextAction).toBeDefined();
    }
  });

  test('alphabetical sort by default', async () => {
    const result = await generatePortfolio(projectRoot);
    const names = result.initiatives.map(s => s.initiative);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  test('--sort last-activity sorts by date descending', async () => {
    const result = await generatePortfolio(projectRoot, { sort: 'last-activity' });
    const dates = result.initiatives.map(s => s.lastArtifact.date || '');
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i] >= dates[i + 1]).toBe(true);
    }
  });

  test('performance: under 5 seconds for full scan (NFR1)', async () => {
    const start = Date.now();
    await generatePortfolio(projectRoot);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });

  test('summary counts governed + ungoverned + unattributed = total', async () => {
    const result = await generatePortfolio(projectRoot);
    expect(result.summary.total).toBe(
      result.summary.governed + result.summary.ungoverned + result.summary.unattributed
    );
  });

  test('health score has governed, total, percentage fields', async () => {
    const result = await generatePortfolio(projectRoot);
    expect(result.summary.healthScore).toBeDefined();
    expect(typeof result.summary.healthScore.governed).toBe('number');
    expect(typeof result.summary.healthScore.total).toBe('number');
    expect(typeof result.summary.healthScore.percentage).toBe('number');
    expect(result.summary.healthScore.percentage).toBeGreaterThanOrEqual(0);
    expect(result.summary.healthScore.percentage).toBeLessThanOrEqual(100);
  });

  test('health score total matches attributable files (governed + ungoverned)', async () => {
    const result = await generatePortfolio(projectRoot);
    expect(result.summary.healthScore.total).toBe(result.summary.governed + result.summary.ungoverned);
  });

  test('ungoverned files are indexed in portfolio (not skipped)', async () => {
    const result = await generatePortfolio(projectRoot);
    // Real repo has files with resolved initiative but no frontmatter — these should appear
    expect(result.summary.ungoverned).toBeGreaterThan(0);
    // At least some initiatives should have results
    const withArtifacts = result.initiatives.filter(s => s.lastArtifact.file !== null);
    expect(withArtifacts.length).toBeGreaterThan(0);
  });

  test('degraded results show inferred confidence', async () => {
    const result = await generatePortfolio(projectRoot);
    // Ungoverned initiatives (no frontmatter) should have inferred confidence
    for (const s of result.initiatives) {
      if (s.phase.value && s.phase.value !== 'unknown') {
        expect(['explicit', 'inferred']).toContain(s.phase.confidence);
      }
    }
  });

  test('known initiatives from taxonomy are present', async () => {
    const result = await generatePortfolio(projectRoot);
    const names = result.initiatives.map(s => s.initiative);
    expect(names).toContain('gyre');
    expect(names).toContain('helm');
    expect(names).toContain('forge');
    expect(names).toContain('vortex');
  });
});

// --- formatTerminal tests ---

describe('formatTerminal', () => {
  test('produces aligned column output', () => {
    const initiatives = [
      { initiative: 'gyre', phase: { value: 'planning', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'gyre-prd.md', date: '2026-04-01' }, nextAction: { value: 'Create architecture', source: 'conflict-resolver' } }
    ];
    const output = formatTerminal(initiatives);
    expect(output).toContain('Initiative');
    expect(output).toContain('Phase');
    expect(output).toContain('Status');
    expect(output).toContain('gyre');
    expect(output).toContain('planning');
  });

  test('shows (explicit) for explicit confidence', () => {
    const initiatives = [
      { initiative: 'helm', phase: { value: 'discovery', confidence: 'inferred' }, status: { value: 'validated', confidence: 'explicit' }, lastArtifact: { file: 'a.md', date: '2026-04-01' }, nextAction: { value: 'Next step', source: 'test' } }
    ];
    const output = formatTerminal(initiatives);
    expect(output).toContain('(explicit)');
  });

  test('shows (inferred) for inferred confidence', () => {
    const initiatives = [
      { initiative: 'forge', phase: { value: 'build', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'a.md', date: '2026-04-01' }, nextAction: { value: null, source: null } }
    ];
    const output = formatTerminal(initiatives);
    expect(output).toContain('(inferred)');
  });

  test('unknown shows as unknown (inferred) -- never bare', () => {
    const initiatives = [
      { initiative: 'bmm', phase: { value: 'unknown', confidence: 'inferred' }, status: { value: 'unknown', confidence: 'inferred' }, lastArtifact: { file: null, date: null }, nextAction: { value: 'Create PRD', source: 'test' } }
    ];
    const output = formatTerminal(initiatives);
    expect(output).toContain('unknown (inferred)');
  });

  test('empty initiatives -> message', () => {
    const output = formatTerminal([]);
    expect(output).toContain('No initiatives found');
  });

  test('context fallback to lastArtifact when no nextAction', () => {
    const initiatives = [
      { initiative: 'convoke', phase: { value: 'planning', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'convoke-prd.md', date: '2026-04-01' }, nextAction: { value: null, source: null } }
    ];
    const output = formatTerminal(initiatives);
    expect(output).toContain('Last: convoke-prd.md');
  });
});

// --- formatMarkdown tests ---

describe('formatMarkdown', () => {
  test('produces valid markdown table', () => {
    const initiatives = [
      { initiative: 'gyre', phase: { value: 'planning', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'gyre-prd.md', date: '2026-04-01' }, nextAction: { value: 'Create arch', source: 'test' } }
    ];
    const output = formatMarkdown(initiatives);
    expect(output).toContain('| Initiative |');
    expect(output).toContain('|------------|');
    expect(output).toContain('| gyre |');
  });

  test('shows (explicit) and (inferred) markers', () => {
    const initiatives = [
      { initiative: 'helm', phase: { value: 'discovery', confidence: 'inferred' }, status: { value: 'validated', confidence: 'explicit' }, lastArtifact: { file: 'a.md', date: '2026-04-01' }, nextAction: { value: 'Next', source: 'test' } },
      { initiative: 'forge', phase: { value: 'build', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'b.md', date: '2026-04-01' }, nextAction: { value: 'Continue', source: 'test' } }
    ];
    const output = formatMarkdown(initiatives);
    expect(output).toContain('(explicit)');
    expect(output).toContain('(inferred)');
  });

  test('empty initiatives -> message', () => {
    const output = formatMarkdown([]);
    expect(output).toContain('No initiatives found');
  });
});

// --- makeEmptyState ---

describe('makeEmptyState', () => {
  test('creates state with correct initiative and null fields', () => {
    const state = makeEmptyState('test');
    expect(state.initiative).toBe('test');
    expect(state.phase.value).toBeNull();
    expect(state.status.value).toBeNull();
    expect(state.lastArtifact.file).toBeNull();
    expect(state.nextAction.value).toBeNull();
  });
});
