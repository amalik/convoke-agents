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

  it('reports error for wrong module path', async () => {
    const agentFile = path.join(moduleDir, 'agents', 'wrong-module.md');
    await fs.writeFile(agentFile, `# Wrong Module Agent

<activation config="_bmad/bme/_test-team/config.yaml" module="bme/_wrong-team">
  <agent name="Wrong" />
</activation>
`, 'utf8');

    const result = await validateActivation([agentFile], moduleConfig);
    assert.equal(result.valid, false);
    const moduleCheck = result.results[0].checks.find(c => c.check === 'Module path reference');
    assert.equal(moduleCheck.passed, false);
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
