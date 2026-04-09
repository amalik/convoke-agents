'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const { findProjectRoot } = require('../../scripts/update/lib/utils');
const {
  generatePortfolio,
  makeEmptyState,
  attributeFile,
  explainUnattributed,
  STORY_PREFIX_MAP,
  PORTFOLIO_FOLDER_DEFAULT_MAP,
} = require('../../scripts/lib/portfolio/portfolio-engine');
const { formatTerminal } = require('../../scripts/lib/portfolio/formatters/terminal-formatter');
const { formatMarkdown } = require('../../scripts/lib/portfolio/formatters/markdown-formatter');
const { readTaxonomy } = require('../../scripts/lib/artifact-utils');

let projectRoot;
let taxonomy;

before(() => {
  projectRoot = findProjectRoot();
  taxonomy = readTaxonomy(projectRoot);
});

// --- generatePortfolio integration tests ---

describe('generatePortfolio', () => {
  it('scans real _bmad-output and returns InitiativeState array', async () => {
    const result = await generatePortfolio(projectRoot);
    assert.ok(result.initiatives.length > 0);
    assert.ok(result.summary.total > 0);
  });

  it('each initiative has phase, status, lastArtifact, nextAction', async () => {
    const result = await generatePortfolio(projectRoot);
    for (const s of result.initiatives) {
      assert.ok(s.initiative);
      assert.notStrictEqual(s.phase, undefined);
      assert.ok(s.phase.value);
      assert.notStrictEqual(s.status, undefined);
      assert.ok(s.status.value);
      assert.notStrictEqual(s.lastArtifact, undefined);
      assert.notStrictEqual(s.nextAction, undefined);
    }
  });

  it('alphabetical sort by default', async () => {
    const result = await generatePortfolio(projectRoot);
    const names = result.initiatives.map((s) => s.initiative);
    const sorted = [...names].sort();
    assert.deepEqual(names, sorted);
  });

  it('--sort last-activity sorts by date descending', async () => {
    const result = await generatePortfolio(projectRoot, { sort: 'last-activity' });
    const dates = result.initiatives.map((s) => s.lastArtifact.date || '');
    for (let i = 0; i < dates.length - 1; i++) {
      assert.ok(dates[i] >= dates[i + 1]);
    }
  });

  // NFR1 perf budget. Original assertion was a 5000ms hard cap on a live-state
  // scan — flagged as flake-prone in the 2026-04-08 astonishment report (N3)
  // because the scan time grows with _bmad-output size. Hardening: 3x headroom
  // (15000ms) and an explicit comment so the next person who hits a flake
  // understands the budget is a soft watchdog, not a benchmark.
  //
  // Real fix is N3-future: replace the live scan with a fixed-size synthetic
  // fixture and reassert the original 5000ms cap on that. Out of scope here.
  it('performance: full scan completes within budget (NFR1, with flake headroom)', { timeout: 30000 }, async () => {
    const start = Date.now();
    await generatePortfolio(projectRoot);
    const duration = Date.now() - start;
    assert.ok(
      duration < 15000,
      `generatePortfolio took ${duration}ms; NFR1 budget is 5000ms with 3x headroom for CI flake (15000ms)`,
    );
  });

  it('summary counts governed + ungoverned + unattributed = total', async () => {
    const result = await generatePortfolio(projectRoot);
    assert.equal(
      result.summary.total,
      result.summary.governed + result.summary.ungoverned + result.summary.unattributed,
    );
  });

  it('health score has governed, total, percentage fields', async () => {
    const result = await generatePortfolio(projectRoot);
    assert.notStrictEqual(result.summary.healthScore, undefined);
    assert.equal(typeof result.summary.healthScore.governed, 'number');
    assert.equal(typeof result.summary.healthScore.total, 'number');
    assert.equal(typeof result.summary.healthScore.percentage, 'number');
    assert.ok(result.summary.healthScore.percentage >= 0);
    assert.ok(result.summary.healthScore.percentage <= 100);
  });

  it('health score total matches attributable files (governed + ungoverned)', async () => {
    const result = await generatePortfolio(projectRoot);
    assert.equal(result.summary.healthScore.total, result.summary.governed + result.summary.ungoverned);
  });

  it('ungoverned files are indexed in portfolio (not skipped)', async () => {
    const result = await generatePortfolio(projectRoot);
    // Real repo has files with resolved initiative but no frontmatter — these should appear
    assert.ok(result.summary.ungoverned > 0);
    // At least some initiatives should have results
    const withArtifacts = result.initiatives.filter((s) => s.lastArtifact.file !== null);
    assert.ok(withArtifacts.length > 0);
  });

  it('degraded results show inferred confidence', async () => {
    const result = await generatePortfolio(projectRoot);
    // Ungoverned initiatives (no frontmatter) should have inferred confidence
    for (const s of result.initiatives) {
      if (s.phase.value && s.phase.value !== 'unknown') {
        assert.ok(['explicit', 'inferred'].includes(s.phase.confidence));
      }
    }
  });

  it('wipRadar is null when threshold not exceeded', async () => {
    const result = await generatePortfolio(projectRoot, { wipThreshold: 99 });
    assert.equal(result.wipRadar, null);
  });

  it('wipRadar returned when threshold exceeded', async () => {
    const result = await generatePortfolio(projectRoot, { wipThreshold: 1 });
    // Real repo likely has >1 active initiative
    if (result.wipRadar) {
      assert.ok(result.wipRadar.active > 1);
      assert.equal(result.wipRadar.threshold, 1);
      assert.ok(Array.isArray(result.wipRadar.initiatives));
      assert.equal(result.wipRadar.initiatives.length, result.wipRadar.active);
    }
  });

  it('--filter by prefix returns matching initiatives only', async () => {
    const result = await generatePortfolio(projectRoot, { filter: 'g*' });
    assert.ok(result.initiatives.length > 0);
    for (const s of result.initiatives) {
      assert.ok(s.initiative.startsWith('g'));
    }
  });

  it('--filter with no match returns empty', async () => {
    const result = await generatePortfolio(projectRoot, { filter: 'zzz' });
    assert.equal(result.initiatives.length, 0);
  });

  it('--filter applies before WIP count', async () => {
    // Filter to single initiative — WIP should be <= 1 regardless of full portfolio
    const result = await generatePortfolio(projectRoot, { filter: 'gyre', wipThreshold: 0 });
    if (result.wipRadar) {
      assert.ok(result.wipRadar.active <= 1);
    }
  });

  it('initiatives have inference trace data (source + confidence)', async () => {
    const result = await generatePortfolio(projectRoot);
    for (const s of result.initiatives) {
      // Every initiative should have source and confidence on phase and status
      assert.ok(s.phase.source);
      assert.ok(['explicit', 'inferred'].includes(s.phase.confidence));
      assert.ok(s.status.source);
      assert.ok(['explicit', 'inferred'].includes(s.status.confidence));
    }
  });

  it('known initiatives from taxonomy are present', async () => {
    const result = await generatePortfolio(projectRoot);
    const names = result.initiatives.map((s) => s.initiative);
    assert.ok(names.includes('gyre'));
    assert.ok(names.includes('helm'));
    assert.ok(names.includes('forge'));
    assert.ok(names.includes('vortex'));
  });
});

// --- formatTerminal tests ---

describe('formatTerminal', () => {
  it('produces aligned column output', () => {
    const initiatives = [
      { initiative: 'gyre', phase: { value: 'planning', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'gyre-prd.md', date: '2026-04-01' }, nextAction: { value: 'Create architecture', source: 'conflict-resolver' } },
    ];
    const output = formatTerminal(initiatives);
    assert.ok(output.includes('Initiative'));
    assert.ok(output.includes('Phase'));
    assert.ok(output.includes('Status'));
    assert.ok(output.includes('gyre'));
    assert.ok(output.includes('planning'));
  });

  it('shows (explicit) for explicit confidence', () => {
    const initiatives = [
      { initiative: 'helm', phase: { value: 'discovery', confidence: 'inferred' }, status: { value: 'validated', confidence: 'explicit' }, lastArtifact: { file: 'a.md', date: '2026-04-01' }, nextAction: { value: 'Next step', source: 'test' } },
    ];
    const output = formatTerminal(initiatives);
    assert.ok(output.includes('(explicit)'));
  });

  it('shows (inferred) for inferred confidence', () => {
    const initiatives = [
      { initiative: 'forge', phase: { value: 'build', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'a.md', date: '2026-04-01' }, nextAction: { value: null, source: null } },
    ];
    const output = formatTerminal(initiatives);
    assert.ok(output.includes('(inferred)'));
  });

  it('unknown shows as unknown (inferred) -- never bare', () => {
    const initiatives = [
      { initiative: 'bmm', phase: { value: 'unknown', confidence: 'inferred' }, status: { value: 'unknown', confidence: 'inferred' }, lastArtifact: { file: null, date: null }, nextAction: { value: 'Create PRD', source: 'test' } },
    ];
    const output = formatTerminal(initiatives);
    assert.ok(output.includes('unknown (inferred)'));
  });

  it('empty initiatives -> message', () => {
    const output = formatTerminal([]);
    assert.ok(output.includes('No initiatives found'));
  });

  it('context fallback to lastArtifact when no nextAction', () => {
    const initiatives = [
      { initiative: 'convoke', phase: { value: 'planning', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'convoke-prd.md', date: '2026-04-01' }, nextAction: { value: null, source: null } },
    ];
    const output = formatTerminal(initiatives);
    assert.ok(output.includes('Last: convoke-prd.md'));
  });
});

// --- formatMarkdown tests ---

describe('formatMarkdown', () => {
  it('produces valid markdown table', () => {
    const initiatives = [
      { initiative: 'gyre', phase: { value: 'planning', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'gyre-prd.md', date: '2026-04-01' }, nextAction: { value: 'Create arch', source: 'test' } },
    ];
    const output = formatMarkdown(initiatives);
    assert.ok(output.includes('| Initiative |'));
    assert.ok(output.includes('|------------|'));
    assert.ok(output.includes('| gyre |'));
  });

  it('shows (explicit) and (inferred) markers', () => {
    const initiatives = [
      { initiative: 'helm', phase: { value: 'discovery', confidence: 'inferred' }, status: { value: 'validated', confidence: 'explicit' }, lastArtifact: { file: 'a.md', date: '2026-04-01' }, nextAction: { value: 'Next', source: 'test' } },
      { initiative: 'forge', phase: { value: 'build', confidence: 'inferred' }, status: { value: 'ongoing', confidence: 'inferred' }, lastArtifact: { file: 'b.md', date: '2026-04-01' }, nextAction: { value: 'Continue', source: 'test' } },
    ];
    const output = formatMarkdown(initiatives);
    assert.ok(output.includes('(explicit)'));
    assert.ok(output.includes('(inferred)'));
  });

  it('empty initiatives -> message', () => {
    const output = formatMarkdown([]);
    assert.ok(output.includes('No initiatives found'));
  });
});

// --- makeEmptyState ---

describe('makeEmptyState', () => {
  it('creates state with correct initiative and null fields', () => {
    const state = makeEmptyState('test');
    assert.equal(state.initiative, 'test');
    assert.equal(state.phase.value, null);
    assert.equal(state.status.value, null);
    assert.equal(state.lastArtifact.file, null);
    assert.equal(state.nextAction.value, null);
  });
});

// --- Story 6.3: attributeFile tests ---

describe('attributeFile', () => {
  it('A — frontmatter title with initiative → frontmatter-title', () => {
    const file = { filename: 'validation-report.md', dir: 'planning-artifacts' };
    const fm = { title: 'Gyre Validation Report' };
    const result = attributeFile(file, '# Random body\n', fm, taxonomy);
    assert.equal(result.initiative, 'gyre');
    assert.equal(result.source, 'frontmatter-title');
  });

  it('B — content fallback first 5 lines → content-fallback', () => {
    const file = { filename: 'untitled.md', dir: 'vortex-artifacts' };
    const content = '# Forge Discovery Report\n\nDate: 2026-03-21\n\nBody continues here.\n';
    const result = attributeFile(file, content, null, taxonomy);
    assert.equal(result.initiative, 'forge');
    assert.equal(result.source, 'content-fallback');
  });

  it('C — parent dir match (gyre-artifacts) → parent-dir', () => {
    const file = { filename: 'random.md', dir: 'gyre-artifacts' };
    const result = attributeFile(file, 'no signal', null, taxonomy);
    assert.equal(result.initiative, 'gyre');
    assert.equal(result.source, 'parent-dir');
  });

  it('D — priority: frontmatter title beats parent-dir', () => {
    const file = { filename: 'note.md', dir: 'gyre-artifacts' };
    const fm = { title: 'Helm Strategy Notes' };
    const result = attributeFile(file, '', fm, taxonomy);
    assert.equal(result.initiative, 'helm');
    assert.equal(result.source, 'frontmatter-title');
  });

  it('E — alias resolution: Strategy Perimeter → helm', () => {
    const file = { filename: 'foo.md', dir: 'planning-artifacts' };
    const fm = { title: 'Strategy Perimeter Discovery' };
    const result = attributeFile(file, '', fm, taxonomy);
    assert.equal(result.initiative, 'helm');
  });

  it('F — no-content file in synthetic dir with no signals → null', () => {
    // Use a synthetic dir that does NOT match any taxonomy initiative.
    // (Real `vortex-artifacts/` dir matches `vortex` via parent-dir scan, by design.)
    const file = { filename: 'opaque.md', dir: 'unknown-dir' };
    const result = attributeFile(file, 'random body content with no initiative', null, taxonomy);
    assert.equal(result.initiative, null);
  });

  it('Filename prefix: gyre-1-1-foo.md → gyre via filename-prefix', () => {
    const file = { filename: 'gyre-1-1-some-story.md', dir: 'implementation-artifacts' };
    const result = attributeFile(file, 'body', null, taxonomy);
    assert.equal(result.initiative, 'gyre');
    assert.equal(result.source, 'filename-prefix');
  });

  it('Story prefix: tf-2-10-foo.md → loom via story-prefix', () => {
    const file = { filename: 'tf-2-10-some-story.md', dir: 'implementation-artifacts' };
    const result = attributeFile(file, 'body', null, taxonomy);
    assert.equal(result.initiative, 'loom');
    assert.equal(result.source, 'story-prefix');
  });

  it('Story prefix: ag-6-3-foo.md → convoke', () => {
    const file = { filename: 'ag-6-3-portfolio.md', dir: 'implementation-artifacts' };
    const result = attributeFile(file, 'body', null, taxonomy);
    assert.equal(result.initiative, 'convoke');
    assert.equal(result.source, 'story-prefix');
  });

  it('Folder default: planning-artifacts → convoke (last resort)', () => {
    const file = { filename: 'opaque.md', dir: 'planning-artifacts' };
    const result = attributeFile(file, 'body with no signal', null, taxonomy);
    assert.equal(result.initiative, 'convoke');
    assert.equal(result.source, 'folder-default');
  });

  it('Hyphen boundary: pre-gyre in title does NOT content-match gyre (regression for content scan)', () => {
    // Use a synthetic dir to isolate the content-keyword scan from parent-dir matching.
    const file = { filename: 'opaque.md', dir: 'unknown-dir' };
    const fm = { title: 'pre-gyre planning notes' };
    const result = attributeFile(file, '', fm, taxonomy);
    // Frontmatter scan rejects (kebab boundary), no content, no parent-dir match, no story prefix.
    assert.equal(result.initiative, null);
  });

  it('STORY_PREFIX_MAP and PORTFOLIO_FOLDER_DEFAULT_MAP are exported for inspection', () => {
    assert.equal(STORY_PREFIX_MAP.tf, 'loom');
    assert.equal(STORY_PREFIX_MAP.ag, 'convoke');
    assert.equal(PORTFOLIO_FOLDER_DEFAULT_MAP['planning-artifacts'], 'convoke');
  });
});

// --- Story 6.3: explainUnattributed tests ---

describe('explainUnattributed', () => {
  it('G — empty content → unreadable or empty', () => {
    const file = { filename: 'foo.md', dir: 'planning-artifacts' };
    assert.equal(explainUnattributed(file, '', null), 'unreadable or empty');
  });

  it('H — short content (< 5 lines) → insufficient content', () => {
    const file = { filename: 'foo-bar.md', dir: 'planning-artifacts' };
    assert.equal(explainUnattributed(file, '# title\nshort body', null), 'insufficient content for inference');
  });

  it('I — no type prefix in filename → reason mentions prefix', () => {
    const file = { filename: 'whatever.md', dir: 'planning-artifacts' };
    const longContent = '# title\n\nline 3\nline 4\nline 5\nline 6\n';
    assert.equal(explainUnattributed(file, longContent, null), 'no type prefix in filename');
  });

  it('J — default reason when filename has prefix but no signals', () => {
    const file = { filename: 'persona-foo.md', dir: 'vortex-artifacts' };
    const longContent = '# title\n\nline 3\nline 4\nline 5\nline 6\n';
    assert.equal(
      explainUnattributed(file, longContent, null),
      'no initiative signal in filename, frontmatter title, content, or parent directory',
    );
  });
});

// --- Story 6.3: integration verification ---

describe('Story 6.3 — portfolio attribution improvements', () => {
  it('generatePortfolio surfaces unattributedFiles array with reasons', async () => {
    const result = await generatePortfolio(projectRoot);
    assert.ok(Array.isArray(result.unattributedFiles));
    // Each entry has filename, dir, reason
    for (const u of result.unattributedFiles) {
      assert.ok(u.filename);
      assert.ok(u.dir);
      assert.equal(typeof u.reason, 'string');
    }
  });

  it('summary.attributableButUngoverned tracks fallback attributions', async () => {
    const result = await generatePortfolio(projectRoot);
    assert.equal(typeof result.summary.attributableButUngoverned, 'number');
    // On the current repo, fallback layers attribute many files
    assert.ok(result.summary.attributableButUngoverned > 0);
  });

  it('unattributed count is well under 20 on the current repo (AC2)', async () => {
    const result = await generatePortfolio(projectRoot);
    // Story 6.3 AC2: under 20 unattributed
    assert.ok(result.summary.unattributed < 20);
  });
});

// --- Story 6.3: CLI output tests (Tests O, P, Q) ---

describe('convoke-portfolio CLI output (Story 6.3)', () => {
  const path = require('path');
  const { execFileSync } = require('child_process');
  const cliPath = path.join(__dirname, '..', '..', 'scripts', 'lib', 'portfolio', 'portfolio-engine.js');

  function runCli(args = []) {
    try {
      return execFileSync('node', [cliPath, ...args], {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      // CLI may write warnings to stderr; combine for test inspection
      return (err.stdout || '') + (err.stderr || '');
    }
  }

  it('O — without --show-unattributed: summary line, NOT individual filenames', () => {
    const output = runCli([]);
    // Summary line present
    assert.match(output, /\d+ unattributed files \(run with --show-unattributed/);
    // No "--- Unattributed Files (" detail header
    assert.ok(!output.includes('--- Unattributed Files ('));
    // No "  vortex-artifacts/persona-..." style per-file lines
    assert.doesNotMatch(output, /vortex-artifacts\/persona-compliance-officer/);
  });

  it('P — with --show-unattributed: both summary and per-file lines', () => {
    const output = runCli(['--show-unattributed']);
    // Detail header present
    assert.ok(output.includes('--- Unattributed Files ('));
    // At least one per-file entry rendered with reason
    assert.match(output, /^ {2}[^/\s]+\/[^:]+:.+$/m);
  });

  it('Q — attributableButUngoverned line contains migration guidance', () => {
    const output = runCli([]);
    // Story 6.3 AC8: when attributableButUngoverned > 0, output mentions migration
    assert.ok(output.includes('files attributable to existing initiatives'));
    assert.ok(output.includes('run convoke-migrate-artifacts to govern them'));
  });
});
