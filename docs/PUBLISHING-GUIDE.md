# Convoke Publishing Guide

**Date:** 2026-02-15
**Version:** 1.0.0-alpha
**Status:** Ready to publish

---

## 🎯 Quick Start

```bash
# 1. Login to npm (first time only)
npm login

# 2. Test the package locally
npm pack

# 3. Publish to npm
npm publish --access public
```

---

## 📋 Complete Publishing Checklist

### Phase 1: Pre-Publishing Verification

#### 1.1 Critical Files Check ✅

- [x] **package.json** - Package metadata ✅
- [x] **LICENSE** - MIT license ✅
- [x] **README.md** - Project overview ✅
- [x] **.npmignore** - Exclude test artifacts ✅
- [x] **index.js** - Package entry point ✅

#### 1.2 Documentation Check ✅

- [x] **README.md** - Complete with installation instructions ✅
- [x] **INSTALLATION.md** - Detailed installation guide ✅
- [x] **EMMA-USER-GUIDE.md** - Emma documentation ✅
- [x] **WADE-USER-GUIDE.md** - Wade documentation ✅
- [x] **BMAD-METHOD-COMPATIBILITY.md** - Compatibility guide ✅

#### 1.3 Agent Files Check ✅

Emma (empathy-mapper):
- [x] Agent file: `_bmad/bme/_designos/agents/empathy-mapper.md` ✅
- [x] Workflow: `_bmad/bme/_designos/workflows/empathy-map/workflow.md` ✅
- [x] 6 step files ✅
- [x] Template: `empathy-map.template.md` ✅

Wade (wireframe-designer):
- [x] Agent file: `_bmad/bme/_designos/agents/wireframe-designer.md` ✅
- [x] Workflow: `_bmad/bme/_designos/workflows/wireframe/workflow.md` ✅
- [x] 6 step files ✅
- [x] Template: `wireframe.template.md` ✅

#### 1.4 Installation Scripts Check ✅

- [x] `scripts/install-emma.js` ✅
- [x] `scripts/install-wade.js` ✅
- [x] `scripts/install-all-agents.js` ✅
- [x] `scripts/postinstall.js` ✅
- [x] All scripts executable ✅
- [x] All scripts have BMAD Method prerequisite check (optional detection) ✅

#### 1.5 Test Results Check ✅

- [x] Emma: 100% P0 pass rate (18/18 tests) ✅
- [x] Wade: 100% P0 pass rate (18/18 tests) ✅
- [x] Emma live tests: 100% (5/5) ✅
- [x] Wade live tests: 100% (5/5) ✅

---

### Phase 2: Local Testing

#### 2.1 Create Test Package

```bash
# From Convoke directory
npm pack
```

**Expected output:**
```
npm notice
npm notice 📦  convoke-agents@1.0.0-alpha
npm notice === Tarball Contents ===
npm notice 38.6kB package.json
npm notice 45.2kB _bmad/bme/_designos/agents/empathy-mapper.md
npm notice ...
npm notice === Tarball Details ===
npm notice name:          convoke
npm notice version:       1.0.0-alpha
npm notice filename:      convoke-1.0.0-alpha.tgz
npm notice package size:  XX.X kB
npm notice unpacked size: XXX kB
npm notice total files:   XX
npm notice
convoke-1.0.0-alpha.tgz
```

#### 2.2 Test Installation Locally

```bash
# Create test directory
mkdir -p /tmp/bmad-test
cd /tmp/bmad-test

# Simulate BMAD Method installation (create _bmad directory)
mkdir -p _bmad/_config
echo "test: true" > _bmad/_config/bmad.yaml

# Install from local package
npm install /Users/amalikamriou/convoke/convoke-1.0.0-alpha.tgz

# Test installation
npx convoke-install
```

**Expected output:**
```
╔════════════════════════════════════════════════════╗
║                                                    ║
║        Convoke Complete Installer 🚀        ║
║                                                    ║
║     Installing Emma + Wade Design Agents          ║
║                                                    ║
╚════════════════════════════════════════════════════╝

[1/6] Checking prerequisites...
  ✓ BMAD Method detected
  ✓ BMAD configuration found
  ✓ Prerequisites met
[2/6] Installing Emma + Wade agent files...
  → Installing Emma (empathy-mapper)...
  ✓ Emma installed
  → Installing Wade (wireframe-designer)...
  ✓ Wade installed
[3/6] Configuring agents...
  ✓ Created config.yaml
  ✓ Created agent-manifest.csv
[4/6] Setting up output directory...
  ✓ Output directory ready
[5/6] Verifying installation...
  ✓ Emma agent file
  ✓ Wade agent file
  ✓ Emma workflow
  ✓ Wade workflow
  ✓ Configuration file
  ✓ All files installed successfully
[6/6] Installing user guides...
  ✓ User guides installed

╔════════════════════════════════════════════════════╗
║                                                    ║
║    ✓  All Agents Successfully Installed! 🎉       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

#### 2.3 Test Agents Work

```bash
# Test Emma
cat _bmad/bme/_designos/agents/empathy-mapper.md

# Test Wade
cat _bmad/bme/_designos/agents/wireframe-designer.md
```

**Expected:** Agent activation messages should display.

#### 2.4 Cleanup Test

```bash
cd /Users/amalikamriou/convoke
rm -rf /tmp/bmad-test
rm convoke-1.0.0-alpha.tgz
```

---

### Phase 3: GitHub Repository Setup

#### 3.1 Verify Repository URL

Current: `https://github.com/amalik/convoke-agents.git`

Verify this repository exists and is accessible.

#### 3.2 Create GitHub Repository (if needed)

If repository doesn't exist yet:

1. Go to https://github.com/new
2. Repository name: `convoke`
3. Description: "Domain-Specialized Agents for BMAD Method"
4. Public repository
5. Don't initialize with README (already have one)
6. Create repository

#### 3.3 Push Code to GitHub

```bash
cd /Users/amalikamriou/convoke

# Initialize git (if not already)
git init

# Add remote (if not already)
git remote add origin https://github.com/amalik/convoke-agents.git

# Add all files
git add .

# Create initial commit
git commit -m "Initial release: Convoke v1.0.0-alpha

Features:
- Emma (empathy-mapper) - Empathy Mapping Specialist
- Wade (wireframe-designer) - Wireframe Design Expert
- Complete installation system with npm scripts
- Comprehensive documentation (README, INSTALLATION, user guides)
- 100% test pass rate (18 P0 tests per agent)
- BMAD Method prerequisite checking

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
git branch -M main
git push -u origin main
```

#### 3.4 Create GitHub Release

1. Go to: `https://github.com/amalik/convoke-agents/releases/new`
2. Tag version: `v1.0.0-alpha`
3. Release title: `Convoke v1.0.0-alpha - Initial Release`
4. Description:

```markdown
# Convoke v1.0.0-alpha

**First public release of Convoke!** 🎉

Domain-specialized agents for BMAD Method - expert agents for design, quality, and standards workflows.

## ✨ What's Included

### Agents (2)
- **Emma (empathy-mapper)** - Empathy Mapping Specialist
- **Wade (wireframe-designer)** - Wireframe Design Expert

### Features
- ✅ One-command installation (`npm install convoke-agents@alpha && npx convoke-install`)
- ✅ BMAD Method prerequisite checking
- ✅ 100% test pass rate (36 total tests across both agents)
- ✅ Comprehensive user guides (16KB each)
- ✅ Complete documentation (README, INSTALLATION, compatibility guides)

## 📦 Installation

**Prerequisite:** Install BMAD Method first
```bash
npx bmad-method@alpha install
```

**Install Convoke:**
```bash
npm install convoke-agents@alpha
npx convoke-install
```

## 📚 Documentation

- [README.md](README.md) - Project overview
- [INSTALLATION.md](INSTALLATION.md) - Installation guide
- [EMMA-USER-GUIDE.md](_bmad-output/design-artifacts/EMMA-USER-GUIDE.md) - Emma documentation
- [WADE-USER-GUIDE.md](_bmad-output/design-artifacts/WADE-USER-GUIDE.md) - Wade documentation

## 🧪 Test Results

**Emma:**
- P0 Tests: 18/18 (100%)
- Live Tests: 5/5 (100%)

**Wade:**
- P0 Tests: 18/18 (100%)
- Live Tests: 5/5 (100%)

## 🚀 What's Next

Upcoming agents:
- Sage (quality-gatekeeper) - Quality Gates & Decision Workflows
- Stan (standards-auditor) - Standards Compliance & Audit

---

**npm package:** https://www.npmjs.com/package/convoke-agents
**GitHub:** https://github.com/amalik/convoke-agents
```

5. Publish release

---

### Phase 4: npm Publishing

#### 4.1 Login to npm

```bash
npm login
```

**Prompts:**
- Username: [your npm username]
- Password: [your npm password]
- Email: [your email]
- OTP (if 2FA enabled): [your code]

#### 4.2 Verify Package Contents

```bash
npm pack --dry-run
```

This shows what will be included in the package without creating the tarball.

**Review output:** Ensure no test artifacts or sensitive files are included.

#### 4.3 Publish to npm

**Option A: Publish as alpha (recommended for first release)**

```bash
npm publish --access public --tag alpha
```

Users install with:
```bash
npm install convoke-agents@alpha
```

**Option B: Publish as latest**

```bash
npm publish --access public
```

Users install with:
```bash
npm install convoke
```

**Recommendation:** Use `--tag alpha` for first release, then promote to latest after community feedback.

#### 4.4 Verify npm Publication

1. Go to: `https://www.npmjs.com/package/convoke-agents`
2. Verify package shows up
3. Check version is correct (1.0.0-alpha)
4. Verify README displays correctly

#### 4.5 Test Installation from npm

```bash
# Create fresh test directory
mkdir -p /tmp/bmad-npm-test
cd /tmp/bmad-npm-test

# Simulate BMAD Method
mkdir -p _bmad/_config
echo "test: true" > _bmad/_config/bmad.yaml

# Install from npm
npm install convoke-agents@alpha

# Test
npx convoke-install
```

---

### Phase 5: Post-Publication

#### 5.1 Update README Badges (Optional)

Add npm version badge to README:

```markdown
[![npm version](https://badge.fury.io/js/convoke-agents.svg)](https://www.npmjs.com/package/convoke-agents)
[![Downloads](https://img.shields.io/npm/dm/convoke-agents.svg)](https://www.npmjs.com/package/convoke-agents)
```

#### 5.2 Announce Release

**Where to announce:**
- GitHub Discussions (if enabled)
- BMAD Method repository (issue/discussion)
- Social media (Twitter, LinkedIn)
- Dev.to / Medium (blog post)

**Sample announcement:**

```
🎉 Introducing Convoke v1.0.0-alpha!

Domain-specialized agents for BMAD Method:
- Emma: Empathy Mapping Specialist
- Wade: Wireframe Design Expert

Install:
npm install convoke-agents@alpha && npx convoke-install

Docs: https://github.com/amalik/convoke-agents
npm: https://www.npmjs.com/package/convoke-agents
```

#### 5.3 Create CHANGELOG.md

```bash
# Create changelog for future updates
```

#### 5.4 Monitor Issues

- Watch GitHub repository for issues
- Monitor npm package page for feedback
- Respond to questions promptly

---

## 🔄 Future Updates

### Patch Release (1.0.1-alpha)

Bug fixes, documentation updates:

```bash
# Update version
npm version patch

# Publish
npm publish --access public --tag alpha
```

### Minor Release (1.1.0-alpha)

New features (Quinn or Stan agents):

```bash
# Update version
npm version minor

# Publish
npm publish --access public --tag alpha
```

### Promote from Alpha to Stable

After community testing:

```bash
# Update version (remove -alpha)
npm version 1.0.0

# Publish as latest
npm publish --access public

# Update alpha tag to point to latest
npm dist-tag add convoke-agents@1.0.0 latest
```

---

## ⚠️ Troubleshooting

### "You do not have permission to publish"

**Solution:** Ensure you're logged in with correct account:
```bash
npm whoami  # Check current user
npm logout
npm login   # Login again
```

### "Package name already exists"

**Solution:** Package name `convoke` is taken. Options:
- Use scoped package: `@yourusername/convoke`
- Choose different name

### "402 Payment Required"

**Solution:** Use `--access public` flag:
```bash
npm publish --access public
```

### Files missing from npm package

**Solution:** Check `.npmignore` - ensure files aren't excluded:
```bash
npm pack --dry-run  # Preview package contents
```

---

## 📊 Success Metrics

After publishing, track:

- **npm downloads** - Weekly/monthly download count
- **GitHub stars** - Community interest
- **Issues opened** - User engagement
- **Pull requests** - Community contributions

**Access stats:**
- npm: `https://www.npmjs.com/package/convoke-agents`
- GitHub Insights: `https://github.com/amalik/convoke-agents/pulse`

---

## ✅ Final Checklist Before Publishing

- [ ] All tests passing (Emma + Wade = 100%)
- [ ] LICENSE file created
- [ ] README.md complete and accurate
- [ ] package.json version correct (1.0.0-alpha)
- [ ] Repository URL correct in package.json
- [ ] .npmignore excludes test artifacts
- [ ] Local package test successful
- [ ] GitHub repository created and pushed
- [ ] npm login successful
- [ ] Ready to run `npm publish --access public --tag alpha`

---

**Ready to publish?** Follow the steps above and Convoke will be live! 🚀
