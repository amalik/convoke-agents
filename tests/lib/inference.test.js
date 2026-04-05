const path = require('path');
const fs = require('fs-extra');
const {
  inferArtifactType,
  inferInitiative,
  getGovernanceState,
  generateNewFilename,
  readTaxonomy,
  ARTIFACT_TYPE_ALIASES
} = require('../../scripts/lib/artifact-utils');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// Load real taxonomy for all tests
let taxonomy;
beforeAll(() => {
  const projectRoot = findProjectRoot();
  taxonomy = readTaxonomy(projectRoot);
});

// --- inferArtifactType tests ---

describe('inferArtifactType', () => {
  test('prd-gyre.md → type: prd', () => {
    const result = inferArtifactType('prd-gyre.md', taxonomy);
    expect(result.type).toBe('prd');
    expect(result.remainder).toBe('gyre');
  });

  test('lean-persona greedy match over persona', () => {
    const result = inferArtifactType('lean-persona-strategic-navigator-2026-04-04.md', taxonomy);
    expect(result.type).toBe('lean-persona');
    expect(result.remainder).toBe('strategic-navigator');
    expect(result.date).toBe('2026-04-04');
  });

  test('HC prefix stripped: hc2-problem-definition → problem-def', () => {
    const result = inferArtifactType('hc2-problem-definition-gyre-2026-03-21.md', taxonomy);
    expect(result.type).toBe('problem-def');
    expect(result.hcPrefix).toBe('hc2');
    expect(result.remainder).toBe('gyre');
    expect(result.date).toBe('2026-03-21');
  });

  test('HC prefix: hc3-hypothesis-contract → hypothesis', () => {
    const result = inferArtifactType('hc3-hypothesis-contract-forge-2026-03-21.md', taxonomy);
    expect(result.type).toBe('hypothesis');
    expect(result.hcPrefix).toBe('hc3');
    expect(result.remainder).toBe('forge');
  });

  test('epic-forge-phase-a.md → type: epic', () => {
    const result = inferArtifactType('epic-forge-phase-a.md', taxonomy);
    expect(result.type).toBe('epic');
    expect(result.remainder).toBe('forge-phase-a');
  });

  test('empathy-map-strategic-navigator → type: empathy-map', () => {
    const result = inferArtifactType('empathy-map-strategic-navigator-2026-04-05.md', taxonomy);
    expect(result.type).toBe('empathy-map');
    expect(result.remainder).toBe('strategic-navigator');
  });

  test('decision-scope-forge → type: decision', () => {
    const result = inferArtifactType('decision-scope-forge-2026-03-21.md', taxonomy);
    expect(result.type).toBe('decision');
    expect(result.remainder).toBe('scope-forge');
  });

  test('signal-gyre-brownfield-pilot → type: signal', () => {
    const result = inferArtifactType('signal-gyre-brownfield-pilot-2026-04-02.md', taxonomy);
    expect(result.type).toBe('signal');
    expect(result.remainder).toBe('gyre-brownfield-pilot');
  });

  test('pre-registration → pre-reg via ARTIFACT_TYPE_ALIASES', () => {
    const result = inferArtifactType('pre-registration-strategy-perimeter-2026-04-04.md', taxonomy);
    expect(result.type).toBe('pre-reg');
    expect(result.remainder).toBe('strategy-perimeter');
  });

  test('architecture-gyre.md → arch via ARTIFACT_TYPE_ALIASES', () => {
    const result = inferArtifactType('architecture-gyre.md', taxonomy);
    expect(result.type).toBe('arch');
    expect(result.remainder).toBe('gyre');
  });

  test('architecture.md → arch via ARTIFACT_TYPE_ALIASES (exact match)', () => {
    const result = inferArtifactType('architecture.md', taxonomy);
    expect(result.type).toBe('arch');
    expect(result.remainder).toBe('');
  });

  test('unknown type file → null', () => {
    const result = inferArtifactType('initiatives-backlog.md', taxonomy);
    expect(result.type).toBeNull();
  });

  test('accuracy-validation (no known type) → null', () => {
    const result = inferArtifactType('accuracy-validation-2026-03-23.md', taxonomy);
    expect(result.type).toBeNull();
    expect(result.date).toBe('2026-03-23');
  });

  test('ARTIFACT_TYPE_ALIASES has expected mappings', () => {
    expect(ARTIFACT_TYPE_ALIASES['problem-definition']).toBe('problem-def');
    expect(ARTIFACT_TYPE_ALIASES['pre-registration']).toBe('pre-reg');
    expect(ARTIFACT_TYPE_ALIASES['architecture']).toBe('arch');
    expect(ARTIFACT_TYPE_ALIASES['hypothesis-contract']).toBe('hypothesis');
  });
});

// --- inferInitiative tests ---

describe('inferInitiative', () => {
  test('gyre → exact match', () => {
    const result = inferInitiative('gyre', taxonomy);
    expect(result.initiative).toBe('gyre');
    expect(result.confidence).toBe('high');
    expect(result.source).toBe('exact');
  });

  test('strategy-perimeter → helm via alias', () => {
    const result = inferInitiative('strategy-perimeter', taxonomy);
    expect(result.initiative).toBe('helm');
    expect(result.confidence).toBe('high');
    expect(result.source).toBe('alias');
  });

  test('team-factory → loom via alias', () => {
    const result = inferInitiative('team-factory', taxonomy);
    expect(result.initiative).toBe('loom');
    expect(result.confidence).toBe('high');
    expect(result.source).toBe('alias');
  });

  test('strategic-navigator → helm via alias', () => {
    const result = inferInitiative('strategic-navigator', taxonomy);
    expect(result.initiative).toBe('helm');
    expect(result.confidence).toBe('high');
    expect(result.source).toBe('alias');
  });

  test('forge-phase-a → forge from first segment', () => {
    const result = inferInitiative('forge-phase-a', taxonomy);
    expect(result.initiative).toBe('forge');
    expect(result.confidence).toBe('high');
  });

  test('gyre-brownfield-pilot → gyre from first segment', () => {
    const result = inferInitiative('gyre-brownfield-pilot', taxonomy);
    expect(result.initiative).toBe('gyre');
    expect(result.confidence).toBe('high');
  });

  test('strategy-concierge → helm via strategy alias (progressive prefix)', () => {
    const result = inferInitiative('strategy-concierge', taxonomy);
    expect(result.initiative).toBe('helm');
    expect(result.confidence).toBe('high');
    expect(result.source).toBe('alias');
  });

  test('team-factory-review-fixes → loom via alias (progressive prefix)', () => {
    const result = inferInitiative('team-factory-review-fixes', taxonomy);
    expect(result.initiative).toBe('loom');
    expect(result.confidence).toBe('high');
    expect(result.source).toBe('alias');
  });

  test('empty remainder → ambiguous', () => {
    const result = inferInitiative('', taxonomy);
    expect(result.initiative).toBeNull();
    expect(result.confidence).toBe('low');
  });

  test('unrecognized segments → ambiguous with low confidence', () => {
    const result = inferInitiative('baseartifact-contract', taxonomy);
    expect(result.initiative).toBeNull();
    expect(result.confidence).toBe('low');
  });

  test('engineering-lead → ambiguous (no matching initiative or alias)', () => {
    const result = inferInitiative('engineering-lead', taxonomy);
    expect(result.initiative).toBeNull();
    expect(result.confidence).toBe('low');
  });

  test('prd-validation-gyre → gyre via progressive prefix (segments: prd, validation, gyre)', () => {
    // After type 'report' is stripped, remainder might be 'prd-validation-gyre'
    const result = inferInitiative('prd-validation-gyre', taxonomy);
    expect(result.initiative).toBe('gyre');
    expect(result.confidence).toBe('high');
  });
});

// --- getGovernanceState tests ---

describe('getGovernanceState', () => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'artifact-samples');

  test('fully-governed: matching convention + matching frontmatter', () => {
    const content = fs.readFileSync(path.join(fixturesDir, 'governed-gyre-prd.md'), 'utf8');
    // This file has frontmatter: initiative: gyre — but filename doesn't follow new convention
    // Let's test with a proper governed filename
    const result = getGovernanceState('gyre-prd.md', content, taxonomy);
    // gyre-prd.md: type=prd, initiative=gyre (from remainder after prd-), frontmatter=gyre
    // Actually: inferArtifactType('gyre-prd.md') — 'gyre' is not an artifact type, so type=null → ungoverned
    // The NEW convention is {initiative}-{type}.md, but inferArtifactType looks for type prefix
    // Need a file where type IS the prefix: prd-gyre.md with matching frontmatter
    const result2 = getGovernanceState('prd-gyre.md', '---\ninitiative: gyre\nartifact_type: prd\n---\n# PRD', taxonomy);
    expect(result2.state).toBe('fully-governed');
    expect(result2.fileInitiative).toBe('gyre');
    expect(result2.frontmatterInitiative).toBe('gyre');
  });

  test('half-governed: matching convention, no frontmatter', () => {
    const result = getGovernanceState('prd-gyre.md', '# PRD Gyre\n\nContent without frontmatter', taxonomy);
    expect(result.state).toBe('half-governed');
    expect(result.fileInitiative).toBe('gyre');
    expect(result.frontmatterInitiative).toBeNull();
  });

  test('ungoverned: filename does not match convention', () => {
    const result = getGovernanceState('initiatives-backlog.md', '# Backlog', taxonomy);
    expect(result.state).toBe('ungoverned');
  });

  test('invalid-governed: convention name but different frontmatter initiative', () => {
    const content = '---\ninitiative: gyre\n---\n# Conflict';
    const result = getGovernanceState('prd-helm.md', content, taxonomy);
    // filename says helm, frontmatter says gyre
    expect(result.state).toBe('invalid-governed');
    expect(result.fileInitiative).toBe('helm');
    expect(result.frontmatterInitiative).toBe('gyre');
  });

  test('ungoverned: type matches but initiative is ambiguous', () => {
    const result = getGovernanceState('persona-engineering-lead-2026-03-21.md', '# Persona', taxonomy);
    expect(result.state).toBe('ungoverned');
  });
});

// --- generateNewFilename tests ---

describe('generateNewFilename', () => {
  test('prd-gyre.md → gyre-prd.md', () => {
    const result = generateNewFilename('prd-gyre.md', 'gyre', 'prd', taxonomy);
    expect(result).toBe('gyre-prd.md');
  });

  test('HC file: gyre-problem-def-hc2-{date}.md', () => {
    const result = generateNewFilename('hc2-problem-definition-gyre-2026-03-21.md', 'gyre', 'problem-def', taxonomy);
    expect(result).toBe('gyre-problem-def-hc2-2026-03-21.md');
  });

  test('lean-persona with qualifier preserved', () => {
    const result = generateNewFilename('lean-persona-strategic-navigator-2026-04-04.md', 'helm', 'lean-persona', taxonomy);
    // After type 'lean-persona' and initiative alias 'strategic-navigator' → helm, no remaining qualifier
    expect(result).toBe('helm-lean-persona-2026-04-04.md');
  });

  test('dated file preserves date', () => {
    const result = generateNewFilename('brief-gyre-2026-03-19.md', 'gyre', 'brief', taxonomy);
    expect(result).toBe('gyre-brief-2026-03-19.md');
  });

  test('undated file omits date', () => {
    const result = generateNewFilename('prd-gyre.md', 'gyre', 'prd', taxonomy);
    expect(result).not.toContain('2026');
  });

  test('epic with qualifier', () => {
    const result = generateNewFilename('epic-forge-phase-a.md', 'forge', 'epic', taxonomy);
    expect(result).toBe('forge-epic-phase-a.md');
  });

  test('scope-decision with alias resolution', () => {
    const result = generateNewFilename('scope-decision-strategy-perimeter-2026-04-04.md', 'helm', 'scope', taxonomy);
    // After type 'scope', remainder is 'decision-strategy-perimeter'.
    // Initiative 'strategy-perimeter' consumed from segments. Qualifier: 'decision'
    expect(result).toBe('helm-scope-decision-2026-04-04.md');
  });
});
