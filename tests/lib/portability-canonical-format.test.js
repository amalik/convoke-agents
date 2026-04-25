'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// Story sp-2-1: Canonical Format Specification
//
// Validates the 3 canonical-format spec files against AC #1-#7. The spec
// itself is human-authored markdown, not generated code, so the tests
// enforce structural and content invariants the spec promises.

const TEMPLATES_DIR_REL = path.join('scripts', 'portability', 'templates');

const REQUIRED_FILES = [
  'canonical-format.md',
  'canonical-example.md',
  'readme-template.md',
];

// Forbidden strings — every Claude-specific token, framework call, and
// micro-file directive that the canonical example must NOT contain.
// P3 (sp-2-1 review): expanded to cover bmad-speak, framework path leakage,
// and additional micro-file directive variants the spec calls out.
const FORBIDDEN_IN_EXAMPLE = [
  // Claude tool names
  'Read tool',
  'Edit tool',
  'Write tool',
  'Bash tool',
  'Glob tool',
  'Grep tool',
  'Skill tool',
  // Framework calls
  'bmad-init',
  'bmad-help',
  'bmad-speak',
  // Framework paths (must be stripped per canonical-format.md)
  '_bmad/',
  '.claude/hooks',
  '{project-root}',
  // Micro-file directives (all variants from canonical-format.md)
  'Load step:',
  'read fully and follow',
  'Read fully and execute:',
  'Load fully and follow:',
];

// All 7 Claude tool names that must appear in canonical-format.md's
// transformation rules table (verifies the exporter has guidance for each).
const REQUIRED_TOOL_NAMES_IN_FORMAT = [
  'Read tool',
  'Edit tool',
  'Write tool',
  'Bash tool',
  'Glob tool',
  'Grep tool',
  'Skill tool',
];

describe('Canonical format specification (sp-2-1)', () => {
  let projectRoot;
  let templatesDir;
  let canonicalFormatContent;
  let canonicalExampleContent;
  let readmeTemplateContent;

  before(() => {
    projectRoot = findProjectRoot();
    templatesDir = path.join(projectRoot, TEMPLATES_DIR_REL);
    // P1 (sp-2-1 review): hard-fail if any required template file is missing.
    // Returning empty string would cause Tests 3 and 4 to silently pass
    // (no forbidden strings in '', no curly placeholders in '').
    const readRequired = (name) => {
      const p = path.join(templatesDir, name);
      if (!fs.existsSync(p)) {
        throw new Error(
          `Required template file missing: ${path.relative(projectRoot, p)}. ` +
          `sp-2-1 spec requires all 3 template files to exist.`
        );
      }
      return fs.readFileSync(p, 'utf8');
    };
    canonicalFormatContent = readRequired('canonical-format.md');
    canonicalExampleContent = readRequired('canonical-example.md');
    readmeTemplateContent = readRequired('readme-template.md');
  });

  it('Test 1: all 3 template files exist and are non-empty', () => {
    for (const filename of REQUIRED_FILES) {
      const filePath = path.join(templatesDir, filename);
      assert.equal(fs.existsSync(filePath), true);
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.length > 0);
      // Sanity: each spec file should have at least one heading
      assert.match(content, /^#/m);
    }
  });

  it('Test 2: canonical-example.md contains all required section headings in order', () => {
    // Per AC #2: 7 sections in order. P4 (sp-2-1 review): include Quality
    // checks (section 7) — Carson's example has it, so we validate ordering
    // for all 7 sections explicitly.
    const requiredHeadingPatterns = [
      /^# Brainstorming/m, // Title — anchored to specific text to avoid ## prefix collision
      /^## You are /m, // Persona
      /^## When to use this skill$/m,
      /^## Inputs you may need$/m,
      /^## How to proceed$/m,
      /^## What you produce$/m,
      /^## Quality checks$/m, // Section 7 (Carson's example includes it)
    ];

    // Verify each pattern matches AND capture the actual match index.
    // P2 (sp-2-1 review): use RegExp.exec().index instead of indexOf(m[0]) —
    // the latter searches for the bare 2-char string "# " which appears at
    // offset 1 inside every "## " heading and silently breaks ordering.
    const positions = requiredHeadingPatterns.map((pattern) => {
      const re = new RegExp(pattern.source, pattern.flags);
      const match = re.exec(canonicalExampleContent);
      assert.notStrictEqual(match, null);
      return match.index;
    });

    // Verify the headings appear in the correct ORDER
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] <= positions[i - 1]) {
        throw new Error(
          `Section heading ${i + 1} (pattern ${requiredHeadingPatterns[i]}) ` +
          `appears at offset ${positions[i]}, which is not after section ${i} ` +
          `(at offset ${positions[i - 1]}). Sections are out of order.`
        );
      }
    }
  });

  it('Test 3: canonical-example.md contains NO forbidden Claude tool names or framework calls', () => {
    const violations = [];
    for (const forbidden of FORBIDDEN_IN_EXAMPLE) {
      if (canonicalExampleContent.includes(forbidden)) {
        violations.push(forbidden);
      }
    }
    if (violations.length > 0) {
      console.error('canonical-example.md contains forbidden strings:', violations);
    }
    assert.deepEqual(violations, []);
  });

  it('Test 4: canonical-example.md contains ZERO curly-brace placeholders', () => {
    // Per AC #3: every {var-name} reference must be replaced with a your-X
    // hyphenated placeholder during canonical export (BUG-7 wording refinement
    // 2026-04-25 — was [your X] bracket form pre-fix). The finalized example
    // must therefore contain no curly-brace placeholders at all.
    const placeholderRegex = /\{[\w-]+\}/g;
    const matches = canonicalExampleContent.match(placeholderRegex) || [];
    if (matches.length > 0) {
      console.error(
        `canonical-example.md contains ${matches.length} unsubstituted placeholder(s):`,
        matches
      );
    }
    assert.deepEqual(matches, []);
  });

  it('Test 5: canonical-format.md contains all 7 Claude tool names in its replacement table', () => {
    // The transformation rules table must document a replacement for every
    // Claude-specific tool the export engine might encounter.
    const missing = [];
    for (const toolName of REQUIRED_TOOL_NAMES_IN_FORMAT) {
      if (!canonicalFormatContent.includes(toolName)) {
        missing.push(toolName);
      }
    }
    if (missing.length > 0) {
      console.error('canonical-format.md missing tool name entries:', missing);
    }
    assert.deepEqual(missing, []);
  });

  it('Test 6: canonical-example.md mentions Carson (sanity — wrong skill = wrong persona)', () => {
    // Belt-and-suspenders check: if anyone swaps Carson for a different
    // example, this catches it before it reaches code review.
    assert.match(canonicalExampleContent, /\bCarson\b/);
  });

  it('Test 7: canonical-format.md documents all 3 required top-level sections', () => {
    // Per AC #1: canonical-format.md must contain Template + Transformation
    // rules + Output directory structure as top-level sections.
    assert.match(canonicalFormatContent, /^## Template$/m);
    assert.match(canonicalFormatContent, /^## Transformation rules$/m);
    assert.match(canonicalFormatContent, /^## Output directory structure$/m);
  });

  it('Test 8: readme-template.md documents Claude Code install path', () => {
    // Per AC #7 + Task 4: the README template must document how to install
    // the skill into Claude Code, even though Copilot/Cursor adapters are
    // deferred to sp-5-2.
    assert.match(readmeTemplateContent, /Claude Code/);
    assert.match(readmeTemplateContent, /\.claude\/skills/);
  });
});
