const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { validateActivation, ACTIVATION_REGEX } = require('../../_bmad/bme/_team-factory/lib/writers/activation-validator');

describe('validateActivation', () => {
  let tmpDir;
  let moduleDir;
  let moduleConfig;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-actval-'));
    moduleDir = path.join(tmpDir, '_test-team');
    await fs.ensureDir(path.join(moduleDir, 'agents'));

    // Create config.yaml so config-exists check passes
    await fs.writeFile(path.join(moduleDir, 'config.yaml'), 'submodule_name: _test-team', 'utf8');

    moduleConfig = {
      configPath: '_bmad/bme/_test-team/config.yaml',
      modulePath: 'bme/_test-team',
      moduleDir: moduleDir
    };
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('passes all checks for valid activation block', async () => {
    const agentFile = path.join(moduleDir, 'agents', 'valid-agent.md');
    await fs.writeFile(agentFile, `# Valid Agent

<activation config="_bmad/bme/_test-team/config.yaml" module="bme/_test-team">
  <agent name="Valid Agent" />
</activation>

## Persona
Some content here.
`, 'utf8');

    const result = await validateActivation([agentFile], moduleConfig);
    assert.equal(result.valid, true);
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].errors.length, 0);
    assert.ok(result.results[0].checks.every(c => c.passed));
  });

  it('reports error when activation block is missing', async () => {
    const agentFile = path.join(moduleDir, 'agents', 'no-activation.md');
    await fs.writeFile(agentFile, `# Agent Without Activation

## Persona
No activation block here.
`, 'utf8');

    const result = await validateActivation([agentFile], moduleConfig);
    assert.equal(result.valid, false);
    assert.equal(result.results[0].errors.length, 1);
    assert.ok(result.results[0].errors[0].includes('No <activation> block'));
  });

  it('reports error for wrong config path', async () => {
    const agentFile = path.join(moduleDir, 'agents', 'wrong-config.md');
    await fs.writeFile(agentFile, `# Wrong Config Agent

<activation config="_bmad/bme/_wrong-team/config.yaml" module="bme/_test-team">
  <agent name="Wrong" />
</activation>
`, 'utf8');

    const result = await validateActivation([agentFile], moduleConfig);
    assert.equal(result.valid, false);
    const configCheck = result.results[0].checks.find(c => c.check === 'Config path reference');
    assert.equal(configCheck.passed, false);
  });

  // tf-2-12 R2: rewritten. The previous fixture expressed "wrong module" via a
  // `module="bme/_wrong-team"` ATTRIBUTE — a convention no shipped agent uses and
  // which the validator no longer reads (operator ruling Decision 1, option (c)).
  // Module identity now derives from the config reference, so wrongness is
  // expressed that way. This necessarily overlaps 'wrong config path' above:
  // at the sole call site check 2 implies check 4, and that redundancy is
  // accepted and documented in the validator rather than hidden here.
  it('reports error for wrong module path (derived from the config reference)', async () => {
    const agentFile = path.join(moduleDir, 'agents', 'wrong-module.md');
    await fs.writeFile(agentFile, `# Wrong Module Agent

<activation critical="MANDATORY">
  <step>Load {project-root}/_bmad/bme/_wrong-team/config.yaml</step>
</activation>
`, 'utf8');

    const result = await validateActivation([agentFile], moduleConfig);
    assert.equal(result.valid, false);
    const moduleCheck = result.results[0].checks.find(c => c.check === 'Module path reference');
    assert.equal(moduleCheck.passed, false);
    assert.match(moduleCheck.detail, /resolves to module "bme\/_wrong-team"/);
  });

  it('a stale module= attribute no longer overrides a correct config reference', async () => {
    const agentFile = path.join(moduleDir, 'agents', 'stale-attr.md');
    await fs.writeFile(agentFile, `# Stale Attribute Agent

<activation critical="MANDATORY" module="bme/_long_gone">
  <step>Load {project-root}/_bmad/bme/_test-team/config.yaml</step>
  <llm>If module = "stand-alone", skip.</llm>
</activation>
`, 'utf8');

    const result = await validateActivation([agentFile], moduleConfig);
    assert.deepEqual(result.results[0].errors, [],
      'BMB writes `module = "stand-alone"` into activation bodies; it must not hijack this check');
  });

  it('an empty agentFiles array reports failure, not vacuous success', async () => {
    const result = await validateActivation([], moduleConfig);
    assert.equal(result.valid, false, '[].every() is true — the gate must not confuse "none checked" with "all passed"');
    assert.match(result.results[0].errors[0], /non-empty array/);
  });

  it('a configPath that cannot identify a module fails rather than passing vacuously', async () => {
    const agentFile = path.join(moduleDir, 'agents', 'ok.md');
    await fs.writeFile(agentFile, `<activation critical="MANDATORY"><step>Load {project-root}/_bmad/bme/_test-team/config.yaml</step></activation>`, 'utf8');
    for (const configPath of ['', ' ', 'a', 'config.yaml']) {
      const result = await validateActivation([agentFile], { ...moduleConfig, configPath });
      const c2 = result.results[0].checks.find(c => c.check === 'Config path reference');
      assert.equal(c2.passed, false, `configPath ${JSON.stringify(configPath)} must not satisfy check 2`);
    }
  });

  it('validates multiple agent files', async () => {
    const agent1 = path.join(moduleDir, 'agents', 'multi-1.md');
    const agent2 = path.join(moduleDir, 'agents', 'multi-2.md');
    await fs.writeFile(agent1, `<activation config="_bmad/bme/_test-team/config.yaml" module="bme/_test-team"><agent/></activation>`, 'utf8');
    await fs.writeFile(agent2, `No activation here`, 'utf8');

    const result = await validateActivation([agent1, agent2], moduleConfig);
    assert.equal(result.valid, false);
    assert.equal(result.results.length, 2);
    assert.equal(result.results[0].errors.length, 0);
    assert.ok(result.results[1].errors.length > 0);
  });

  it('reports error when agent file does not exist', async () => {
    const result = await validateActivation(['/nonexistent/agent.md'], moduleConfig);
    assert.equal(result.valid, false);
    assert.ok(result.results[0].errors[0].includes('Cannot read'));
  });
});

// === Read-only enforcement ===

describe('activation-validator read-only enforcement', () => {
  it('module source contains no write operations', async () => {
    const modulePath = path.join(__dirname, '..', '..', '_bmad', 'bme', '_team-factory', 'lib', 'writers', 'activation-validator.js');
    const source = await fs.readFile(modulePath, 'utf8');

    assert.ok(!source.includes('writeFileSync'), 'Module must not contain writeFileSync');
    assert.ok(!source.includes('writeFile('), 'Module must not contain writeFile calls');
    assert.ok(!source.includes('mkdirSync'), 'Module must not contain mkdirSync');
    assert.ok(!source.includes('ensureDir'), 'Module must not contain ensureDir');
    assert.ok(!source.includes('fs.write'), 'Module must not contain fs.write calls');
  });
});

// === ACTIVATION_REGEX ===

describe('ACTIVATION_REGEX', () => {
  it('matches standard activation block', () => {
    const content = '<activation config="path" module="mod">\n  <agent/>\n</activation>';
    const match = content.match(ACTIVATION_REGEX);
    assert.ok(match);
  });

  it('does not match when no activation present', () => {
    const content = '# Just markdown\nNo XML here.';
    const match = content.match(ACTIVATION_REGEX);
    assert.equal(match, null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// tf-2-12 (T129): validate against agents the framework ACTUALLY ships.
//
// Every test above this line builds a synthetic fixture shaped
//   <activation config="..." module="bme/_test-team">
// No shipped BMAD agent carries either attribute, so 184 passing tests
// validated an invented convention while the validator rejected every real
// agent — including the Team Factory's own. These tests join it to reality.
// REPO_ROOT from __dirname, never cwd (see bff7b961).
// ─────────────────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, '..', '..');

describe('tf-2-12: real shipped agents', () => {
  const REAL_AGENT = path.join(REPO_ROOT, '_bmad/bme/_team-factory/agents/team-factory.md');
  const REAL_MODULE_DIR = path.join(REPO_ROOT, '_bmad/bme/_team-factory');
  const realModuleConfig = {
    configPath: '{project-root}/_bmad/bme/_team-factory/config.yaml',
    modulePath: 'bme/_team-factory',
    moduleDir: REAL_MODULE_DIR
  };

  it("the Team Factory's own agent passes the Team Factory's own validator", async () => {
    const result = await validateActivation([REAL_AGENT], realModuleConfig);
    assert.deepEqual(
      result.results[0].errors,
      [],
      'Loom Master must pass; if this fails the validator has drifted from the framework convention again'
    );
    assert.equal(result.valid, true);
  });

  it('a real agent pointing at a DIFFERENT module still fails', async () => {
    const result = await validateActivation([REAL_AGENT], {
      configPath: '{project-root}/_bmad/bme/_vortex/config.yaml',
      modulePath: 'bme/_vortex',
      moduleDir: REAL_MODULE_DIR
    });
    assert.equal(result.valid, false, 'the repair must not become a pass-everything gate (T121)');
  });

  it('an agent with no activation block still fails', async () => {
    const tmp = path.join(os.tmpdir(), `tf212-noact-${Date.now()}.md`);
    await fs.writeFile(tmp, '# Not an agent\n\nNo activation here.\n');
    try {
      const result = await validateActivation([tmp], realModuleConfig);
      assert.equal(result.valid, false);
      assert.match(result.results[0].errors[0], /No <activation> block found/);
    } finally {
      await fs.remove(tmp);
    }
  });
});
