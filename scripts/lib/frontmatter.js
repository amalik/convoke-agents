'use strict';

/**
 * Minimal YAML frontmatter parser/serializer.
 *
 * Drop-in replacement for the subset of `gray-matter` this project used
 * (`matter(raw)` -> { data, content } and `matter.stringify(content, data)`).
 * Built on the already-bundled, maintained `yaml` package so we no longer pull
 * in gray-matter's vulnerable, unfixable js-yaml@3.x transitive dependency
 * (GHSA-h67p-54hq-rp68).
 *
 * Frontmatter is the standard leading `---` fenced YAML block:
 *
 *   ---
 *   key: value
 *   ---
 *   body content...
 */

const YAML = require('yaml');

// Leading `---` fence, the YAML block, then a closing `---` fence on its own line.
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Parse YAML frontmatter from a string.
 *
 * @param {string} raw - Full file content.
 * @returns {{ data: Object, content: string }} Parsed frontmatter object (empty
 *   when no frontmatter is present) and the body that follows it.
 * @throws if the frontmatter block is present but not valid YAML (matches
 *   gray-matter's throwing behavior so existing try/catch callers still work).
 */
function parse(raw) {
  if (typeof raw !== 'string') {
    throw new TypeError('frontmatter.parse expects a string.');
  }

  // Strip a leading UTF-8 BOM, as gray-matter did.
  const input = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;

  const match = FRONTMATTER_RE.exec(input);
  if (!match) {
    return { data: {}, content: input };
  }

  const data = YAML.parse(match[1]) || {};
  const content = input.slice(match[0].length);
  return { data, content };
}

/**
 * Serialize a frontmatter object plus body back into a string.
 *
 * @param {string} content - Body content to place after the frontmatter block.
 * @param {Object} data - Frontmatter fields.
 * @returns {string} Content with a leading `---` fenced YAML block.
 */
function stringify(content, data) {
  const yaml = YAML.stringify(data || {}); // already ends with a trailing newline
  return `---\n${yaml}---\n${content}`;
}

module.exports = { parse, stringify };
