const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const frontmatter = require('../../scripts/lib/frontmatter');

describe('frontmatter.parse', () => {
  it('parses a standard frontmatter block into data + content', () => {
    const raw = '---\ntitle: Hello\ninitiative: helm\nartifact_type: prd\n---\nBody line 1\nBody line 2\n';
    const { data, content } = frontmatter.parse(raw);
    assert.deepEqual(data, { title: 'Hello', initiative: 'helm', artifact_type: 'prd' });
    assert.equal(content, 'Body line 1\nBody line 2\n');
  });

  it('returns empty data and the original content when no frontmatter is present', () => {
    const raw = 'No frontmatter here\njust content\n';
    const { data, content } = frontmatter.parse(raw);
    assert.deepEqual(data, {});
    assert.equal(content, raw);
  });

  it('parses nested arrays, numbers, and booleans', () => {
    const raw = '---\ntitle: T\ntags:\n  - a\n  - b\nnum: 3\nbool: true\n---\n# Heading\n';
    const { data } = frontmatter.parse(raw);
    assert.deepEqual(data, { title: 'T', tags: ['a', 'b'], num: 3, bool: true });
  });

  it('handles a frontmatter-only file with an empty body', () => {
    const { data, content } = frontmatter.parse('---\ntitle: Trailing\n---\n');
    assert.deepEqual(data, { title: 'Trailing' });
    assert.equal(content, '');
  });

  it('strips a leading UTF-8 BOM before parsing', () => {
    const { data } = frontmatter.parse('﻿---\ntitle: BOM\n---\nbody\n');
    assert.deepEqual(data, { title: 'BOM' });
  });

  it('tolerates CRLF line endings', () => {
    const { data, content } = frontmatter.parse('---\r\ntitle: CRLF\r\n---\r\nbody\r\n');
    assert.deepEqual(data, { title: 'CRLF' });
    assert.equal(content, 'body\r\n');
  });

  it('throws on a present-but-invalid YAML block (matches gray-matter)', () => {
    assert.throws(() => frontmatter.parse('---\n: : bad\n---\nbody\n'));
  });

  it('throws when given a non-string', () => {
    assert.throws(() => frontmatter.parse(null), TypeError);
  });
});

describe('frontmatter.stringify', () => {
  it('serializes data + body into a fenced block that round-trips', () => {
    const out = frontmatter.stringify('Body\n', { initiative: 'helm', title: 'Hello' });
    const reparsed = frontmatter.parse(out);
    assert.deepEqual(reparsed.data, { initiative: 'helm', title: 'Hello' });
    assert.equal(reparsed.content, 'Body\n');
  });

  it('emits a leading --- fence', () => {
    const out = frontmatter.stringify('body', { a: 1 });
    assert.match(out, /^---\n/);
  });
});
