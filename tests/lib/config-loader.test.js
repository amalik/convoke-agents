'use strict';

const { describe, it, before, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

const { mockExecFileSync } = require('../mock-cp');

const LOADER_PATH = '../../scripts/update/lib/config-loader';

function makeTmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-config-loader-'));
}

function writeConfig(projectRoot, moduleSubpath, yamlContent) {
  const dir = path.join(projectRoot, '_bmad', moduleSubpath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'config.yaml'), yamlContent, 'utf8');
}

describe('loadModuleConfig — v4 load path (direct YAML)', () => {
  let tmp;
  let loadModuleConfig;

  before(() => {
    // Load once for tests that do NOT need the mocked execFileSync cache reset.
    ({ loadModuleConfig } = require(LOADER_PATH));
  });

  beforeEach(() => {
    tmp = makeTmpProject();
  });

  afterEach(() => {
    fs.removeSync(tmp);
  });

  it('returns the parsed config object when v4 config.yaml is present', () => {
    writeConfig(tmp, 'bme/_vortex',
      'user_name: Amalik\n' +
      'communication_language: English\n' +
      'output_folder: "{project-root}/_bmad-output/vortex-artifacts"\n'
    );

    const result = loadModuleConfig(tmp, 'bme/_vortex');

    assert.equal(result.user_name, 'Amalik');
    assert.equal(result.communication_language, 'English');
    assert.equal(result.output_folder, path.join(tmp, '_bmad-output/vortex-artifacts'));
  });

  it('resolves {project-root} in every top-level string value containing the placeholder', () => {
    writeConfig(tmp, 'bmm',
      'planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"\n' +
      'implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"\n' +
      'project_knowledge: "{project-root}/docs"\n' +
      'output_folder: "{project-root}/_bmad-output"\n' +
      'user_name: Amalik\n'
    );

    const result = loadModuleConfig(tmp, 'bmm');

    assert.equal(result.planning_artifacts, path.join(tmp, '_bmad-output/planning-artifacts'));
    assert.equal(result.implementation_artifacts, path.join(tmp, '_bmad-output/implementation-artifacts'));
    assert.equal(result.project_knowledge, path.join(tmp, 'docs'));
    assert.equal(result.output_folder, path.join(tmp, '_bmad-output'));
    assert.equal(result.user_name, 'Amalik', 'non-placeholder strings pass through unchanged');
  });

  it('passes non-string top-level values (numbers, booleans, nested objects) through unchanged', () => {
    writeConfig(tmp, 'tea',
      'max_retries: 5\n' +
      'enabled: true\n' +
      'disabled: false\n' +
      'settings:\n' +
      '  nested_key: "{project-root}/nested"\n' +
      '  depth: 3\n' +
      'tags:\n' +
      '  - alpha\n' +
      '  - beta\n'
    );

    const result = loadModuleConfig(tmp, 'tea');

    assert.equal(result.max_retries, 5);
    assert.equal(result.enabled, true);
    assert.equal(result.disabled, false);
    assert.deepEqual(result.settings, { nested_key: '{project-root}/nested', depth: 3 },
      'nested {project-root} is NOT resolved — top-level only per audit §5');
    assert.deepEqual(result.tags, ['alpha', 'beta']);
  });

  it('handles nested module paths: bme/_vortex, bme/_enhance, core', () => {
    const cases = [
      ['bme/_vortex', { submodule: 'vortex' }],
      ['bme/_enhance', { submodule: 'enhance' }],
      ['core', { submodule: 'core' }],
    ];

    for (const [subpath, expected] of cases) {
      writeConfig(tmp, subpath, `submodule: ${expected.submodule}\n`);
      const result = loadModuleConfig(tmp, subpath);
      assert.equal(result.submodule, expected.submodule, `failed for ${subpath}`);
    }
  });

  it('throws an actionable error when config is missing and no bmad-init fallback exists', () => {
    assert.throws(
      () => loadModuleConfig(tmp, 'bme/_vortex'),
      (err) => {
        assert.match(err.message, /Config not found/);
        assert.match(err.message, /_bmad\/bme\/_vortex\/config\.yaml/,
          'error should include the missing file path');
        assert.match(err.message, /convoke-install/,
          'error should instruct to run convoke-install');
        return true;
      }
    );
  });

  it('throws an actionable error when YAML is malformed', () => {
    writeConfig(tmp, 'bmm', 'foo: [unclosed\nbar: : :\n');

    assert.throws(
      () => loadModuleConfig(tmp, 'bmm'),
      (err) => {
        assert.match(err.message, /YAML parse error/);
        assert.match(err.message, /_bmad\/bmm\/config\.yaml/,
          'error should include the file path');
        return true;
      }
    );
  });

  it('throws when the YAML file is empty (null parsed result)', () => {
    writeConfig(tmp, 'core', '');

    assert.throws(
      () => loadModuleConfig(tmp, 'core'),
      /YAML object.*top level/
    );
  });

  it('throws when the YAML top-level is an array, not an object', () => {
    writeConfig(tmp, 'core', '- item1\n- item2\n');

    assert.throws(
      () => loadModuleConfig(tmp, 'core'),
      /YAML object.*top level/
    );
  });

  it('throws when the YAML top-level is a scalar, not an object', () => {
    writeConfig(tmp, 'core', 'just_a_string\n');

    assert.throws(
      () => loadModuleConfig(tmp, 'core'),
      /YAML object.*top level/
    );
  });
});

describe('loadModuleConfig — v3 backwards-compat fallback (WR8)', () => {
  let tmp;
  let cpMock;
  let warnSpy;

  beforeEach(() => {
    tmp = makeTmpProject();
    // Create the legacy bmad-init directory so the loader triggers the fallback.
    fs.mkdirSync(
      path.join(tmp, '_bmad/core/bmad-init/scripts'),
      { recursive: true }
    );
    // Write a placeholder script file — the mock intercepts execFileSync before
    // it's actually invoked, but a real path on disk makes the fallback setup realistic.
    fs.writeFileSync(
      path.join(tmp, '_bmad/core/bmad-init/scripts/bmad_init.py'),
      '# placeholder for backwards-compat fallback test\n',
      'utf8'
    );

    cpMock = mockExecFileSync(LOADER_PATH, __dirname);
    warnSpy = mock.method(console, 'warn', () => {});
  });

  afterEach(() => {
    cpMock.restore();
    warnSpy.mock.restore();
    fs.removeSync(tmp);
  });

  it('emits [DEPRECATED] warning and shells out to bmad_init.py when v4 config is absent but legacy dir exists', () => {
    cpMock.setReturnValue(JSON.stringify({
      user_name: 'Amalik',
      output_folder: '{project-root}/_bmad-output',
    }));

    const { loadModuleConfig } = cpMock.module;
    const result = loadModuleConfig(tmp, 'bme/_vortex');

    // Verify deprecation warning fired
    const warnCalls = warnSpy.mock.calls;
    assert.equal(warnCalls.length >= 1, true, 'expected at least one console.warn call');
    assert.match(warnCalls[0].arguments[0], /\[DEPRECATED\]/);
    assert.match(warnCalls[0].arguments[0], /bmad-init/);
    assert.match(warnCalls[0].arguments[0], /convoke-update/);
    assert.match(warnCalls[0].arguments[0], /4\.1/);

    // Verify subprocess invoked with expected arg shape
    assert.equal(cpMock.callCount(), 1);
    const [cmd, args] = cpMock.calls()[0];
    assert.equal(cmd, 'python3');
    assert.equal(args[0].endsWith('bmad_init.py'), true);
    assert.equal(args[1], 'load');
    assert.equal(args[2], '--all');
    assert.equal(args[3], '--module');
    assert.equal(args[4], 'bme/_vortex');
    assert.equal(args[5], '--project-root');
    assert.equal(args[6], tmp);

    // Verify result parsed + placeholder resolved
    assert.equal(result.user_name, 'Amalik');
    assert.equal(result.output_folder, path.join(tmp, '_bmad-output'));
  });

  it('throws when the legacy subprocess exits non-zero', () => {
    cpMock.setImpl(() => {
      const err = new Error('Command failed');
      err.status = 1;
      err.stderr = 'missing_module: bme/_vortex';
      throw err;
    });

    const { loadModuleConfig } = cpMock.module;
    assert.throws(
      () => loadModuleConfig(tmp, 'bme/_vortex'),
      (err) => {
        assert.match(err.message, /Legacy bmad-init fallback failed/);
        assert.match(err.message, /exit 1/);
        assert.match(err.message, /missing_module/);
        assert.match(err.message, /convoke-update/);
        return true;
      }
    );
  });

  it('throws when the legacy subprocess returns non-JSON stdout', () => {
    cpMock.setReturnValue('not json output at all');

    const { loadModuleConfig } = cpMock.module;
    assert.throws(
      () => loadModuleConfig(tmp, 'bme/_vortex'),
      (err) => {
        assert.match(err.message, /non-JSON stdout/);
        assert.match(err.message, /convoke-update/);
        return true;
      }
    );
  });

  it('throws when the legacy subprocess returns a non-object JSON value', () => {
    cpMock.setReturnValue(JSON.stringify(['array', 'not', 'object']));

    const { loadModuleConfig } = cpMock.module;
    assert.throws(
      () => loadModuleConfig(tmp, 'bme/_vortex'),
      /non-object value/
    );
  });
});
