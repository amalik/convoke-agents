'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

const PROJECT_ROOT = findProjectRoot();
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts/audit/drift-snapshot.js');
const FIXTURE_DIR = path.join(PROJECT_ROOT, 'tests/fixtures/drift-snapshot');

describe('drift-snapshot renderer (Story 4.4 — structural-only)', () => {
  it('Test 1: scripts/audit/drift-snapshot.js exists', () => {
    assert.ok(fs.existsSync(SCRIPT_PATH), `expected file at ${SCRIPT_PATH}`);
  });

  it('Test 2: required exports present (CR-L3 R1 + R2 — all 15 exports validated)', () => {
    const m = require(SCRIPT_PATH);
    const expected = [
      'DEFAULT_SKILLS',
      'SKILL_DISPLAY',
      'BASELINE_DIR_DEFAULT',
      'POST_MIGRATION_DIR_DEFAULT',
      'OUTPUT_PATH_DEFAULT',
      'PROMPTS_PER_SKILL',
      'lineDiff',
      'renderSidebySide',
      'renderSnapshot',
      'renderAdhocSnapshot',
      'loadSkillRecording',
      'parseArgs',
      'checkPathSafety',
      'getTodayDate',
      'resolveDefaultRelative',
    ];
    for (const k of expected) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(m, k),
        `drift-snapshot module missing required export: ${k}`
      );
    }
  });

  it('Test 3: lineDiff correctness (LCS — identical / disjoint / mixed)', () => {
    const { lineDiff } = require(SCRIPT_PATH);

    // Identical inputs → all unchanged
    const identical = lineDiff('a\nb\nc', 'a\nb\nc');
    assert.equal(identical.length, 3);
    assert.ok(identical.every((r) => r.type === 'unchanged'), 'identical should produce all-unchanged');

    // Disjoint inputs → all removed then all added
    const disjoint = lineDiff('a\nb', 'c\nd');
    assert.equal(disjoint.length, 4, 'disjoint should produce removed+added = 4 records');
    assert.equal(disjoint.filter((r) => r.type === 'removed').length, 2);
    assert.equal(disjoint.filter((r) => r.type === 'added').length, 2);

    // Mixed inputs → unchanged-removed-added-unchanged
    const mixed = lineDiff('a\nb\nc', 'a\nx\nc');
    const types = mixed.map((r) => r.type);
    // LCS preserves 'a' and 'c'; 'b' is removed; 'x' is added
    assert.ok(types.includes('unchanged'), 'mixed should include unchanged');
    assert.ok(types.includes('removed'), 'mixed should include removed');
    assert.ok(types.includes('added'), 'mixed should include added');
    assert.equal(mixed.filter((r) => r.type === 'unchanged').length, 2, 'mixed should have 2 unchanged (a,c)');
    assert.equal(mixed.filter((r) => r.type === 'removed').length, 1, 'mixed should have 1 removed (b)');
    assert.equal(mixed.filter((r) => r.type === 'added').length, 1, 'mixed should have 1 added (x)');
  });

  it('Test 4: lineDiff purity (10 invocations byte-identical)', () => {
    const { lineDiff } = require(SCRIPT_PATH);
    const a = 'foo\nbar\nbaz';
    const b = 'foo\nqux\nbaz';
    const first = JSON.stringify(lineDiff(a, b));
    for (let i = 0; i < 10; i++) {
      assert.equal(JSON.stringify(lineDiff(a, b)), first, `invocation ${i} must produce same output`);
    }
  });

  it('Test 5: renderSnapshot structural shape (frontmatter + sections + table)', () => {
    const { renderSnapshot } = require(SCRIPT_PATH);
    const out = renderSnapshot({
      skills: ['emma'],
      baselineDir: FIXTURE_DIR,
      postDir: FIXTURE_DIR,
      date: '2026-04-26',
    });

    // (a) Frontmatter with all 8 keys
    const fmMatch = out.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(fmMatch, 'output must start with --- frontmatter');
    const fm = fmMatch[1];
    for (const key of [
      'initiative:',
      'artifact_type:',
      'release_target:',
      'created:',
      'skills:',
      'baseline_dir:',
      'post_migration_dir:',
      'prompts_per_skill:',
    ]) {
      assert.ok(fm.includes(key), `frontmatter missing key: ${key}`);
    }

    // (b) ## Skill: Emma section
    assert.ok(/^## Skill: Emma\s*$/m.test(out), 'output must contain "## Skill: Emma" section');

    // (c) 4 ### Prompt N subsections
    for (let n = 1; n <= 4; n++) {
      assert.ok(new RegExp(`^### Prompt ${n}\\s*$`, 'm').test(out), `output must contain "### Prompt ${n}" subsection`);
    }

    // (d) Side-by-side table syntax
    assert.ok(/^\|.*\|.*\|/m.test(out), 'output must contain markdown table syntax');
  });

  it('Test 6: renderSnapshot skill iteration sorted (lexicographic)', () => {
    const { renderSnapshot } = require(SCRIPT_PATH);
    // Pass skills in non-sorted order: john, emma, winston
    const out = renderSnapshot({
      skills: ['john', 'emma', 'winston'],
      baselineDir: FIXTURE_DIR,
      postDir: FIXTURE_DIR,
      date: '2026-04-26',
    });

    // Find positions of each Skill section
    const emmaPos = out.search(/^## Skill: Emma\s*$/m);
    const johnPos = out.search(/^## Skill: John\s*$/m);
    const winstonPos = out.search(/^## Skill: Winston\s*$/m);

    assert.ok(emmaPos > 0, 'Emma section must appear');
    assert.ok(johnPos > 0, 'John section must appear');
    assert.ok(winstonPos > 0, 'Winston section must appear');

    // Sorted lexicographic by skill key: emma < john < winston
    assert.ok(emmaPos < johnPos, `Emma (${emmaPos}) must appear before John (${johnPos})`);
    assert.ok(johnPos < winstonPos, `John (${johnPos}) must appear before Winston (${winstonPos})`);
  });

  it('Test 7: renderSnapshot byte-identical re-run with explicit --date (NFR32 + AC3)', () => {
    const { renderSnapshot } = require(SCRIPT_PATH);
    const args = {
      skills: ['emma'],
      baselineDir: FIXTURE_DIR,
      postDir: FIXTURE_DIR,
      date: '2026-04-26',
    };
    const out1 = renderSnapshot(args);
    const out2 = renderSnapshot(args);
    assert.equal(out1, out2, 'two invocations with same args must produce byte-identical output');
  });

  it('Test 8: parseArgs defaults (no args; R2 audit — assert literal DEFAULT_SKILLS values)', () => {
    const m = require(SCRIPT_PATH);
    const args = m.parseArgs([]);
    // R2 Auditor: assert literal expected skill keys, not circular reference to module's own constant
    assert.deepEqual(m.DEFAULT_SKILLS, ['emma', 'john', 'winston'], 'DEFAULT_SKILLS must be exactly [emma, john, winston] sorted');
    assert.deepEqual(args.skills, m.DEFAULT_SKILLS, 'parseArgs skills default must equal DEFAULT_SKILLS');
    assert.equal(args.baselineDir, m.BASELINE_DIR_DEFAULT);
    assert.equal(args.postDir, m.POST_MIGRATION_DIR_DEFAULT);
    assert.equal(args.output, m.OUTPUT_PATH_DEFAULT);
    assert.match(args.date, /^\d{4}-\d{2}-\d{2}$/, 'date should default to today in YYYY-MM-DD format');
  });

  it('Test 9: parseArgs overrides', () => {
    const { parseArgs } = require(SCRIPT_PATH);
    const args = parseArgs([
      '--skills', 'emma',
      '--output', '/tmp/x.md',
      '--date', '2026-04-26',
    ]);
    assert.deepEqual(args.skills, ['emma']);
    assert.equal(args.output, '/tmp/x.md');
    assert.equal(args.date, '2026-04-26');
  });

  it('Test 10: parseArgs ad-hoc pair mode (--input-pre / --input-post — AC4)', () => {
    const { parseArgs } = require(SCRIPT_PATH);
    const args = parseArgs(['--input-pre', '/p/a.md', '--input-post', '/p/b.md']);
    assert.equal(args.inputPre, '/p/a.md');
    assert.equal(args.inputPost, '/p/b.md');
  });

  it('Test 11: NFR32 midnight-crossing guard (OS-1 V-pass; CR-M6 R1 try/finally hygiene)', () => {
    const m = require(SCRIPT_PATH);
    const { renderSnapshot } = m;
    const baseArgs = {
      skills: ['emma'],
      baselineDir: FIXTURE_DIR,
      postDir: FIXTURE_DIR,
    };

    try {
      // Simulate two invocations across UTC midnight using DRIFT_SNAPSHOT_TODAY_OVERRIDE
      process.env.DRIFT_SNAPSHOT_TODAY_OVERRIDE = '2026-04-26';
      const args1 = m.parseArgs([]);
      const out1 = renderSnapshot({ ...baseArgs, date: args1.date });

      process.env.DRIFT_SNAPSHOT_TODAY_OVERRIDE = '2026-04-27';
      const args2 = m.parseArgs([]);
      const out2 = renderSnapshot({ ...baseArgs, date: args2.date });

      // Default-date path differs across midnight → frontmatter `created` differs → outputs differ
      assert.notEqual(
        out1,
        out2,
        'default-date renders across UTC midnight MUST differ (proves silent NFR32 failure mode is detectable)'
      );

      // But explicit --date is deterministic regardless of env override
      const explicitArgs = { ...baseArgs, date: '2026-04-26' };
      const explicit1 = renderSnapshot(explicitArgs);
      process.env.DRIFT_SNAPSHOT_TODAY_OVERRIDE = '2099-12-31';
      const explicit2 = renderSnapshot(explicitArgs);
      assert.equal(
        explicit1,
        explicit2,
        'explicit --date renders are byte-identical regardless of env override (operator-mandated determinism)'
      );
    } finally {
      delete process.env.DRIFT_SNAPSHOT_TODAY_OVERRIDE;
    }
  });

  // R1 patch coverage — Tests 12-19 added to cover R1 batch-applied fixes

  it('Test 12: parseArgs throws exitCode=5 on flag-without-value (CR-H1 R1)', () => {
    const { parseArgs } = require(SCRIPT_PATH);
    for (const flag of ['--skills', '--baseline-dir', '--post-dir', '--output', '--date', '--input-pre', '--input-post']) {
      assert.throws(
        () => parseArgs([flag]),
        (err) => err.exitCode === 5 && new RegExp(`${flag} requires a value`).test(err.message),
        `${flag} at end of argv must throw err.exitCode=5 with "requires a value" message`
      );
    }
  });

  it('Test 13: lineDiff normalizes CRLF → LF for cross-platform determinism (CR-H2 R1)', () => {
    const { lineDiff } = require(SCRIPT_PATH);
    // Same logical content, different line endings → all unchanged after normalization
    const result = lineDiff('a\r\nb\r\nc', 'a\nb\nc');
    assert.equal(result.length, 3);
    assert.ok(result.every((r) => r.type === 'unchanged'), 'CRLF vs LF must be normalized to all-unchanged');
  });

  it('Test 14: lineDiff returns [] on both-empty inputs (CR-M4 R1)', () => {
    const { lineDiff } = require(SCRIPT_PATH);
    assert.deepEqual(lineDiff('', ''), []);
  });

  it('Test 15: lineDiff strips trailing newline asymmetry (CR-M5 R1)', () => {
    const { lineDiff } = require(SCRIPT_PATH);
    // 'a\nb\n' and 'a\nb' should compare as identical (trailing \n stripped)
    const result = lineDiff('a\nb\n', 'a\nb');
    assert.equal(result.length, 2);
    assert.ok(result.every((r) => r.type === 'unchanged'), 'trailing-newline asymmetry must not produce phantom diff records');
  });

  it('Test 16: parseArgs --skills dedup + unknown-key validation (CR-M2 + CR-M8 R1)', () => {
    const { parseArgs } = require(SCRIPT_PATH);
    // Dedup
    const args = parseArgs(['--skills', 'emma,emma,john']);
    assert.deepEqual(args.skills, ['emma', 'john'], '--skills must dedup duplicates');

    // Unknown key throws exitCode=5
    assert.throws(
      () => parseArgs(['--skills', 'foo']),
      (err) => err.exitCode === 5 && /unknown --skills key/.test(err.message),
      'unknown --skills key must throw err.exitCode=5'
    );
  });

  it('Test 17: parseArgs XOR validation on --input-pre / --input-post (CR-M9 R1)', () => {
    const { parseArgs } = require(SCRIPT_PATH);
    // Only --input-pre → throw
    assert.throws(
      () => parseArgs(['--input-pre', '/p/a.md']),
      (err) => err.exitCode === 5 && /both or neither/.test(err.message),
      '--input-pre without --input-post must throw err.exitCode=5'
    );
    // Only --input-post → throw
    assert.throws(
      () => parseArgs(['--input-post', '/p/b.md']),
      (err) => err.exitCode === 5 && /both or neither/.test(err.message),
      '--input-post without --input-pre must throw err.exitCode=5'
    );
    // Both → OK
    const args = parseArgs(['--input-pre', '/p/a.md', '--input-post', '/p/b.md']);
    assert.equal(args.inputPre, '/p/a.md');
    assert.equal(args.inputPost, '/p/b.md');
  });

  it('Test 18: parseArgs --date format validation (CR-L6 R1)', () => {
    const { parseArgs } = require(SCRIPT_PATH);
    // Bad format throws
    assert.throws(
      () => parseArgs(['--date', '04/26/2026']),
      (err) => err.exitCode === 5 && /YYYY-MM-DD/.test(err.message),
      'invalid --date format must throw err.exitCode=5'
    );
    // Good format accepted
    const args = parseArgs(['--date', '2026-04-26']);
    assert.equal(args.date, '2026-04-26');
  });

  it('Test 19: renderAdhocSnapshot mismatched filenames produce dual-heading (CR-M7 R1)', () => {
    const { renderAdhocSnapshot } = require(SCRIPT_PATH);
    const inputPre = path.join(FIXTURE_DIR, 'bmad-agent-bme-contextualization-expert-baseline.md');
    const inputPost = path.join(FIXTURE_DIR, 'bmad-agent-architect-post.md');
    const out = renderAdhocSnapshot({ inputPre, inputPost, date: '2026-04-26' });
    // Mismatched filenames → heading reflects both
    assert.ok(
      /## Skill: bmad-agent-bme-contextualization-expert \(pre\) vs bmad-agent-architect \(post\)/.test(out),
      'mismatched ad-hoc filenames must produce dual-heading "{pre} (pre) vs {post} (post)"'
    );
  });

  // R2 patch coverage — Tests 20-24 cover R2 batch-applied fixes

  it('Test 20: parseArgs rejects flag-as-value (R2-M2)', () => {
    const { parseArgs } = require(SCRIPT_PATH);
    // --output --date 2026-04-26 → --output's value is '--date' which must be rejected
    assert.throws(
      () => parseArgs(['--output', '--date', '2026-04-26']),
      (err) => err.exitCode === 5 && /expected a value, got another flag/.test(err.message),
      'flag-as-value must throw err.exitCode=5'
    );
  });

  it('Test 21: parseArgs --date rejects invalid calendar dates (R2 Edge semantic round-trip)', () => {
    const { parseArgs } = require(SCRIPT_PATH);
    // Format-valid but semantically invalid calendar dates
    for (const bad of ['2026-13-32', '2026-02-30', '2026-04-31', '2026-00-15']) {
      assert.throws(
        () => parseArgs(['--date', bad]),
        (err) => err.exitCode === 5 && /not a valid calendar date/.test(err.message),
        `--date ${bad} must throw err.exitCode=5 with semantic-invalid message`
      );
    }
    // Format-valid AND semantically valid calendar dates pass
    const args = parseArgs(['--date', '2026-04-29']);
    assert.equal(args.date, '2026-04-29');
  });

  it('Test 22: renderAdhocSnapshot mismatched filenames emit two-entry skills list (R2-M3)', () => {
    const { renderAdhocSnapshot } = require(SCRIPT_PATH);
    const inputPre = path.join(FIXTURE_DIR, 'bmad-agent-bme-contextualization-expert-baseline.md');
    const inputPost = path.join(FIXTURE_DIR, 'bmad-agent-architect-post.md');
    const out = renderAdhocSnapshot({ inputPre, inputPost, date: '2026-04-26' });
    // Mismatched filenames → frontmatter `skills:` is a 2-entry list (NOT a description string)
    assert.ok(
      /skills: \[bmad-agent-bme-contextualization-expert, bmad-agent-architect\]/.test(out),
      'mismatched filenames must produce frontmatter skills as 2-entry list, not description-string'
    );

    // Matched filenames → frontmatter `skills:` is a 1-entry list
    const matched = renderAdhocSnapshot({
      inputPre,
      inputPost: path.join(FIXTURE_DIR, 'bmad-agent-bme-contextualization-expert-post.md'),
      date: '2026-04-26',
    });
    assert.ok(
      /skills: \[bmad-agent-bme-contextualization-expert\]/.test(matched),
      'matched filenames must produce frontmatter skills as 1-entry list'
    );
  });

  it('Test 23: resolveDefaultRelative resolves defaults against project root, operator-supplied against cwd (R2 Edge M1)', () => {
    const m = require(SCRIPT_PATH);
    const { resolveDefaultRelative, BASELINE_DIR_DEFAULT } = m;
    // Default value → resolved against project root (absolute path now)
    const defaulted = resolveDefaultRelative(BASELINE_DIR_DEFAULT, BASELINE_DIR_DEFAULT);
    assert.ok(path.isAbsolute(defaulted), 'default-value must resolve to absolute path under project root');
    assert.ok(
      defaulted.endsWith(BASELINE_DIR_DEFAULT) || defaulted.includes(BASELINE_DIR_DEFAULT),
      `defaulted path must contain BASELINE_DIR_DEFAULT segment: ${defaulted}`
    );

    // Operator-supplied (≠ default) → returned unchanged (cwd-relative honored as standard CLI convention)
    const userSupplied = resolveDefaultRelative('some-custom-dir', BASELINE_DIR_DEFAULT);
    assert.equal(userSupplied, 'some-custom-dir', 'operator-supplied path must be returned unchanged');
  });

  it('Test 24: lineDiff renders aligned diff prefixes (R2-L1 visual alignment)', () => {
    const { renderSidebySide } = require(SCRIPT_PATH);
    // Mixed content — verify +/- rows have the same column-2 prefix as unchanged
    const out = renderSidebySide('a\nb\nc', 'a\nx\nc');
    // Removed/added rows should have ` ` prefix (one space) before -/+ marker
    assert.ok(/\| `- b`/.test(out), 'removed row must use "` - b`" prefix (with leading space)');
    assert.ok(/\| `\+ x`/.test(out), 'added row must use "` + x`" prefix (with leading space)');
  });
});
