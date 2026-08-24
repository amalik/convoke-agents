'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { initGitFixture, removeTempDirSync } = require('../helpers');
const {
  inferArtifactType,
  inferInitiative,
  suggestInitiative,
  FOLDER_DEFAULT_MAP,
  getGovernanceState,
  generateNewFilename,
  readTaxonomy,
  ARTIFACT_TYPE_ALIASES,
} = require('../../scripts/lib/artifact-utils');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// Load real taxonomy for all tests
let taxonomy;
before(() => {
  const projectRoot = findProjectRoot();
  taxonomy = readTaxonomy(projectRoot);
});

// --- inferArtifactType tests ---

describe('inferArtifactType', () => {
  it('prd-gyre.md → type: prd', () => {
    const result = inferArtifactType('prd-gyre.md', taxonomy);
    assert.equal(result.type, 'prd');
    assert.equal(result.remainder, 'gyre');
  });

  it('lean-persona greedy match over persona', () => {
    const result = inferArtifactType('lean-persona-strategic-navigator-2026-04-04.md', taxonomy);
    assert.equal(result.type, 'lean-persona');
    assert.equal(result.remainder, 'strategic-navigator');
    assert.equal(result.date, '2026-04-04');
  });

  it('HC prefix stripped: hc2-problem-definition → problem-def', () => {
    const result = inferArtifactType('hc2-problem-definition-gyre-2026-03-21.md', taxonomy);
    assert.equal(result.type, 'problem-def');
    assert.equal(result.hcPrefix, 'hc2');
    assert.equal(result.remainder, 'gyre');
    assert.equal(result.date, '2026-03-21');
  });

  it('HC prefix: hc3-hypothesis-contract → hypothesis', () => {
    const result = inferArtifactType('hc3-hypothesis-contract-forge-2026-03-21.md', taxonomy);
    assert.equal(result.type, 'hypothesis');
    assert.equal(result.hcPrefix, 'hc3');
    assert.equal(result.remainder, 'forge');
  });

  it('epic-forge-phase-a.md → type: epic', () => {
    const result = inferArtifactType('epic-forge-phase-a.md', taxonomy);
    assert.equal(result.type, 'epic');
    assert.equal(result.remainder, 'forge-phase-a');
  });

  it('empathy-map-strategic-navigator → type: empathy-map', () => {
    const result = inferArtifactType('empathy-map-strategic-navigator-2026-04-05.md', taxonomy);
    assert.equal(result.type, 'empathy-map');
    assert.equal(result.remainder, 'strategic-navigator');
  });

  it('decision-scope-forge → type: decision', () => {
    const result = inferArtifactType('decision-scope-forge-2026-03-21.md', taxonomy);
    assert.equal(result.type, 'decision');
    assert.equal(result.remainder, 'scope-forge');
  });

  it('signal-gyre-brownfield-pilot → type: signal', () => {
    const result = inferArtifactType('signal-gyre-brownfield-pilot-2026-04-02.md', taxonomy);
    assert.equal(result.type, 'signal');
    assert.equal(result.remainder, 'gyre-brownfield-pilot');
  });

  it('pre-registration → pre-reg via ARTIFACT_TYPE_ALIASES', () => {
    const result = inferArtifactType('pre-registration-strategy-perimeter-2026-04-04.md', taxonomy);
    assert.equal(result.type, 'pre-reg');
    assert.equal(result.remainder, 'strategy-perimeter');
  });

  it('architecture-gyre.md → arch via ARTIFACT_TYPE_ALIASES', () => {
    const result = inferArtifactType('architecture-gyre.md', taxonomy);
    assert.equal(result.type, 'arch');
    assert.equal(result.remainder, 'gyre');
  });

  it('architecture.md → arch via ARTIFACT_TYPE_ALIASES (exact match)', () => {
    const result = inferArtifactType('architecture.md', taxonomy);
    assert.equal(result.type, 'arch');
    assert.equal(result.remainder, '');
  });

  it('unknown type file → null', () => {
    const result = inferArtifactType('initiatives-backlog.md', taxonomy);
    assert.equal(result.type, null);
  });

  it('accuracy-validation (no known type) → null', () => {
    const result = inferArtifactType('accuracy-validation-2026-03-23.md', taxonomy);
    assert.equal(result.type, null);
    assert.equal(result.date, '2026-03-23');
  });

  it('ARTIFACT_TYPE_ALIASES has expected mappings', () => {
    assert.equal(ARTIFACT_TYPE_ALIASES['problem-definition'], 'problem-def');
    assert.equal(ARTIFACT_TYPE_ALIASES['pre-registration'], 'pre-reg');
    assert.equal(ARTIFACT_TYPE_ALIASES['architecture'], 'arch');
    assert.equal(ARTIFACT_TYPE_ALIASES['hypothesis-contract'], 'hypothesis');
  });
});

// --- inferInitiative tests ---

describe('inferInitiative', () => {
  it('gyre → exact match', () => {
    const result = inferInitiative('gyre', taxonomy);
    assert.equal(result.initiative, 'gyre');
    assert.equal(result.confidence, 'high');
    assert.equal(result.source, 'exact');
  });

  it('strategy-perimeter → helm via alias', () => {
    const result = inferInitiative('strategy-perimeter', taxonomy);
    assert.equal(result.initiative, 'helm');
    assert.equal(result.confidence, 'high');
    assert.equal(result.source, 'alias');
  });

  it('team-factory → loom via alias', () => {
    const result = inferInitiative('team-factory', taxonomy);
    assert.equal(result.initiative, 'loom');
    assert.equal(result.confidence, 'high');
    assert.equal(result.source, 'alias');
  });

  it('strategic-navigator → helm via alias', () => {
    const result = inferInitiative('strategic-navigator', taxonomy);
    assert.equal(result.initiative, 'helm');
    assert.equal(result.confidence, 'high');
    assert.equal(result.source, 'alias');
  });

  it('forge-phase-a → forge from first segment', () => {
    const result = inferInitiative('forge-phase-a', taxonomy);
    assert.equal(result.initiative, 'forge');
    assert.equal(result.confidence, 'high');
  });

  it('gyre-brownfield-pilot → gyre from first segment', () => {
    const result = inferInitiative('gyre-brownfield-pilot', taxonomy);
    assert.equal(result.initiative, 'gyre');
    assert.equal(result.confidence, 'high');
  });

  it('strategy-concierge → helm via strategy alias (progressive prefix)', () => {
    const result = inferInitiative('strategy-concierge', taxonomy);
    assert.equal(result.initiative, 'helm');
    assert.equal(result.confidence, 'high');
    assert.equal(result.source, 'alias');
  });

  it('team-factory-review-fixes → loom via alias (progressive prefix)', () => {
    const result = inferInitiative('team-factory-review-fixes', taxonomy);
    assert.equal(result.initiative, 'loom');
    assert.equal(result.confidence, 'high');
    assert.equal(result.source, 'alias');
  });

  it('empty remainder → ambiguous', () => {
    const result = inferInitiative('', taxonomy);
    assert.equal(result.initiative, null);
    assert.equal(result.confidence, 'low');
  });

  it('unrecognized segments → ambiguous with low confidence', () => {
    const result = inferInitiative('baseartifact-contract', taxonomy);
    assert.equal(result.initiative, null);
    assert.equal(result.confidence, 'low');
  });

  it('engineering-lead → ambiguous (no matching initiative or alias)', () => {
    const result = inferInitiative('engineering-lead', taxonomy);
    assert.equal(result.initiative, null);
    assert.equal(result.confidence, 'low');
  });

  it('prd-validation-gyre → gyre via suffix matching', () => {
    const result = inferInitiative('prd-validation-gyre', taxonomy);
    assert.equal(result.initiative, 'gyre');
    assert.equal(result.confidence, 'high');
  });

  it('decision-strategy-perimeter → helm via suffix alias (strategy-perimeter)', () => {
    const result = inferInitiative('decision-strategy-perimeter', taxonomy);
    assert.equal(result.initiative, 'helm');
    assert.equal(result.confidence, 'high');
    assert.equal(result.source, 'alias');
  });
});

// --- getGovernanceState tests ---

describe('getGovernanceState', () => {

  it('fully-governed: matching convention + matching frontmatter', () => {
    const result = getGovernanceState('prd-gyre.md', '---\ninitiative: gyre\nartifact_type: prd\n---\n# PRD', taxonomy);
    assert.equal(result.state, 'fully-governed');
    assert.equal(result.fileInitiative, 'gyre');
    assert.equal(result.frontmatterInitiative, 'gyre');
    assert.deepEqual(result.candidates, []);
  });

  it('half-governed: matching convention, no frontmatter', () => {
    const result = getGovernanceState('prd-gyre.md', '# PRD Gyre\n\nContent without frontmatter', taxonomy);
    assert.equal(result.state, 'half-governed');
    assert.equal(result.fileInitiative, 'gyre');
    assert.equal(result.frontmatterInitiative, null);
  });

  it('ungoverned: filename does not match convention', () => {
    const result = getGovernanceState('initiatives-backlog.md', '# Backlog', taxonomy);
    assert.equal(result.state, 'ungoverned');
  });

  it('invalid-governed: convention name but different frontmatter initiative', () => {
    const content = '---\ninitiative: gyre\n---\n# Conflict';
    const result = getGovernanceState('prd-helm.md', content, taxonomy);
    // filename says helm, frontmatter says gyre
    assert.equal(result.state, 'invalid-governed');
    assert.equal(result.fileInitiative, 'helm');
    assert.equal(result.frontmatterInitiative, 'gyre');
  });

  it('ambiguous: type matches but initiative cannot be confidently inferred', () => {
    const result = getGovernanceState('persona-engineering-lead-2026-03-21.md', '# Persona', taxonomy);
    assert.equal(result.state, 'ambiguous');
    assert.notStrictEqual(result.candidates, undefined);
  });

  it('ungoverned: no type match at all', () => {
    const result = getGovernanceState('accuracy-validation-2026-03-23.md', '# Accuracy', taxonomy);
    assert.equal(result.state, 'ungoverned');
    assert.deepEqual(result.candidates, []);
  });

  it('null fileContent treated as no frontmatter', () => {
    const result = getGovernanceState('prd-gyre.md', null, taxonomy);
    assert.equal(result.state, 'half-governed');
  });
});

// --- generateNewFilename tests ---

describe('generateNewFilename', () => {
  it('prd-gyre.md → gyre-prd.md', () => {
    const result = generateNewFilename('prd-gyre.md', 'gyre', 'prd', taxonomy);
    assert.equal(result, 'gyre-prd.md');
  });

  it('HC file: gyre-problem-def-hc2-{date}.md', () => {
    const result = generateNewFilename('hc2-problem-definition-gyre-2026-03-21.md', 'gyre', 'problem-def', taxonomy);
    assert.equal(result, 'gyre-problem-def-hc2-2026-03-21.md');
  });

  it('lean-persona with qualifier preserved', () => {
    const result = generateNewFilename('lean-persona-strategic-navigator-2026-04-04.md', 'helm', 'lean-persona', taxonomy);
    // After type 'lean-persona' and initiative alias 'strategic-navigator' → helm, no remaining qualifier
    assert.equal(result, 'helm-lean-persona-2026-04-04.md');
  });

  it('dated file preserves date', () => {
    const result = generateNewFilename('brief-gyre-2026-03-19.md', 'gyre', 'brief', taxonomy);
    assert.equal(result, 'gyre-brief-2026-03-19.md');
  });

  it('undated file omits date', () => {
    const result = generateNewFilename('prd-gyre.md', 'gyre', 'prd', taxonomy);
    assert.ok(!result.includes('2026'));
  });

  it('epic with qualifier', () => {
    const result = generateNewFilename('epic-forge-phase-a.md', 'forge', 'epic', taxonomy);
    assert.equal(result, 'forge-epic-phase-a.md');
  });

  it('scope-decision with alias resolution', () => {
    const result = generateNewFilename('scope-decision-strategy-perimeter-2026-04-04.md', 'helm', 'scope', taxonomy);
    // After type 'scope', remainder is 'decision-strategy-perimeter'.
    // Initiative 'strategy-perimeter' consumed from segments. Qualifier: 'decision'
    assert.equal(result, 'helm-scope-decision-2026-04-04.md');
  });
});

// --- suggestInitiative tests (Story 6.2) ---

describe('suggestInitiative', () => {
  // No project root needed for content-based tests; pass a sentinel for the git path.
  // Git step is rate-limited and silently fails on non-tracked files, so it does not interfere.
  const fakeRoot = '/tmp/fake-suggest-root';

  it('A — folder default: planning-artifacts → convoke', () => {
    const content = '# Some Document\n\nNo initiative keywords here.';
    const result = suggestInitiative('some-doc.md', 'planning-artifacts', content, taxonomy, fakeRoot);
    assert.equal(result.initiative, 'convoke');
    assert.equal(result.source, 'folder-default');
    assert.equal(result.confidence, 'low');
  });

  it('B — content keyword: # Gyre Validation Report → gyre', () => {
    const content = '# Gyre Validation Report\n\nDate: 2026-03-23\n';
    const result = suggestInitiative('validation-report.md', 'planning-artifacts', content, taxonomy, fakeRoot);
    assert.equal(result.initiative, 'gyre');
    assert.equal(result.source, 'content-keyword');
    assert.equal(result.confidence, 'medium');
  });

  it('C — alias resolution: Strategy Perimeter title → helm', () => {
    const content = '---\ntitle: "Strategy Perimeter Discovery"\n---\n\nBody.';
    const result = suggestInitiative('discovery.md', 'planning-artifacts', content, taxonomy, fakeRoot);
    assert.equal(result.initiative, 'helm');
    assert.equal(result.source, 'content-keyword');
  });

  it('D — priority: content beats folder default', () => {
    // File in planning-artifacts (would default to convoke) but content mentions gyre
    const content = '# Gyre Pilot Plan\n\nNotes.';
    const result = suggestInitiative('pilot-plan.md', 'planning-artifacts', content, taxonomy, fakeRoot);
    assert.equal(result.initiative, 'gyre');
    assert.equal(result.source, 'content-keyword');
  });

  it('E — git context fallback: real commit message containing initiative ID → source: git-context', () => {
    // Build a temp git repo, commit a file with a message containing 'gyre',
    // then call suggestInitiative against it. This exercises the positive
    // git-context branch (AC10(d)) that the original Test E missed.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'suggest-git-'));
    try {
      initGitFixture(tmpDir);

      const subDir = path.join(tmpDir, '_bmad-output', 'vortex-artifacts');
      fs.ensureDirSync(subDir);
      const filePath = path.join(subDir, 'persona-foo.md');
      // Content has NO initiative keyword and no folder default applies → falls through to git
      fs.writeFileSync(filePath, '# Untitled persona\n\nBody with no signal.', 'utf8');

      execFileSync('git', ['add', '.'], { cwd: tmpDir });
      execFileSync('git', ['commit', '-q', '-m', 'feat: add gyre persona for review'], { cwd: tmpDir });

      const content = fs.readFileSync(filePath, 'utf8');
      const result = suggestInitiative('persona-foo.md', 'vortex-artifacts', content, taxonomy, tmpDir);
      assert.equal(result.initiative, 'gyre');
      assert.equal(result.source, 'git-context');
      assert.equal(result.confidence, 'low');
    } finally {
      removeTempDirSync(tmpDir);
    }
  });

  it('F — no signal: content + folder + git all fail → null', () => {
    const content = '# Untitled\n';
    const result = suggestInitiative('foo.md', 'unknown-dir', content, taxonomy, fakeRoot);
    assert.equal(result.initiative, null);
  });

  it('G — case-insensitivity: GYRE matches', () => {
    const content = '# GYRE Notes\n';
    const result = suggestInitiative('notes.md', 'vortex-artifacts', content, taxonomy, fakeRoot);
    assert.equal(result.initiative, 'gyre');
    assert.equal(result.source, 'content-keyword');
  });

  it('H — whole-word matching: gyrescope does NOT match gyre', () => {
    const content = '# A study of gyrescope dynamics\n';
    const result = suggestInitiative('study.md', 'vortex-artifacts', content, taxonomy, fakeRoot);
    // No content match (gyrescope is not gyre), no folder default for vortex-artifacts
    assert.equal(result.initiative, null);
  });

  it('FOLDER_DEFAULT_MAP exposes the canonical defaults', () => {
    assert.equal(FOLDER_DEFAULT_MAP['planning-artifacts'], 'convoke');
    assert.equal(FOLDER_DEFAULT_MAP['gyre-artifacts'], 'gyre');
    assert.equal(FOLDER_DEFAULT_MAP['vortex-artifacts'], null);
  });

  it('Longest match wins: strategy-perimeter beats strategy', () => {
    // 'strategy' is not an initiative; 'strategy-perimeter' is an alias for 'helm'
    const content = '# Strategy Perimeter Notes\n';
    const result = suggestInitiative('notes.md', 'vortex-artifacts', content, taxonomy, fakeRoot);
    assert.equal(result.initiative, 'helm');
  });

  it('Hyphen boundary: pre-gyre does NOT match initiative gyre (regression)', () => {
    // JS \b treats - as a word boundary, so a naive \bgyre\b would match
    // 'pre-gyre planning'. The fix uses [a-z0-9-]-aware lookarounds.
    const content = '# pre-gyre planning notes\n';
    const result = suggestInitiative('notes.md', 'vortex-artifacts', content, taxonomy, fakeRoot);
    // No content match (boundary class blocks it), no folder default for vortex-artifacts
    assert.equal(result.initiative, null);
  });

  it('Hyphen boundary: meta-gyre-thing does NOT match gyre', () => {
    const content = 'See the meta-gyre-thing for details.';
    const result = suggestInitiative('notes.md', 'vortex-artifacts', content, taxonomy, fakeRoot);
    assert.equal(result.initiative, null);
  });

  it('Hyphen boundary: gyre as standalone word still matches', () => {
    // Sanity check that the new boundary rule didn't break the happy path
    const content = '# gyre planning notes\n';
    const result = suggestInitiative('notes.md', 'vortex-artifacts', content, taxonomy, fakeRoot);
    assert.equal(result.initiative, 'gyre');
  });

  it('Git query cap: 51st call short-circuits without crashing', () => {
    // The cap is module-level state. We can't import the cap constant, but we can
    // call suggestInitiative many times against an untracked file. After the cap
    // is reached, calls return null but the function does not crash.
    // This is a regression guard for the cap logic itself, not a perf test.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'suggest-cap-'));
    try {
      initGitFixture(tmpDir);

      const subDir = path.join(tmpDir, '_bmad-output', 'vortex-artifacts');
      fs.ensureDirSync(subDir);
      // Suppress cap warning during the test
      const origWarn = console.warn;
      console.warn = () => {};
      try {
        // Call suggestInitiative 60 times — exceeds the 50-query cap
        for (let i = 0; i < 60; i++) {
          const result = suggestInitiative(
            `persona-${i}.md`,
            'vortex-artifacts',
            '# untitled\n',
            taxonomy,
            tmpDir,
          );
          // All return null (no content match, no folder default, no git history for untracked)
          assert.equal(result.initiative, null);
        }
      } finally {
        console.warn = origWarn;
      }
    } finally {
      removeTempDirSync(tmpDir);
    }
  });
});
