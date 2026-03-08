# Convoke Real Installation Test Plan

**Date:** 2026-02-15
**Version:** 1.0.3-alpha
**Purpose:** Verify complete installation flow in a fresh repository

---

## Test Objectives

1. Verify BMAD Method installation works
2. Verify Convoke npm package installs correctly
3. Verify npx commands work as documented
4. Verify agents are functional after installation
5. Identify any issues in the real-world installation flow

---

## Test Environment

**Location:** `/tmp/convoke-test-repo`
**Setup:** Fresh directory, no existing BMAD installation
**Requirements:**
- Node.js 14+
- npm
- Internet connection (for npm install)

---

## Test Steps

### Phase 1: Create Test Repository

```bash
# Step 1.1: Create fresh directory
mkdir -p /tmp/convoke-test-repo
cd /tmp/convoke-test-repo

# Step 1.2: Initialize git (optional but realistic)
git init

# Step 1.3: Verify clean state
ls -la
```

**Expected Result:**
- Empty directory (except .git)
- No _bmad/ directory exists

---

### Phase 2: Install BMAD Method

```bash
# Step 2.1: Install BMAD Method using npx
npx bmad-method@alpha install

# Step 2.2: Verify BMAD Method installation
ls -la _bmad/
ls -la _bmad/_config/
```

**Expected Result:**
- `_bmad/` directory created
- `_bmad/_config/` exists
- BMAD Method core files present

**Success Criteria:**
- [ ] _bmad/ directory exists
- [ ] _bmad/_config/ exists
- [ ] No errors during installation

---

### Phase 3: Install Convoke Package

```bash
# Step 3.1: Install convoke from npm
npm install convoke-agents@alpha

# Step 3.2: Verify package installation
ls -la node_modules/convoke/
npm list convoke
```

**Expected Result:**
- convoke-agents@1.0.3-alpha installed in node_modules
- Package appears in npm list

**Success Criteria:**
- [ ] Package installed successfully
- [ ] Correct version (1.0.3-alpha)
- [ ] No errors during installation

---

### Phase 4: Test npx Commands

#### Test 4.1: Install All Agents

```bash
# Step 4.1.1: Run npx convoke-install
npx convoke-install

# Step 4.1.2: Verify agents installed
ls -la _bmad/bme/_designos/agents/
```

**Expected Result:**
- Beautiful installation banner displayed
- Emma agent file created
- Wade agent file created
- Configuration files created
- User guides installed
- Success message displayed

**Success Criteria:**
- [ ] Command runs without errors
- [ ] empathy-mapper.md exists
- [ ] wireframe-designer.md exists
- [ ] config.yaml created
- [ ] User guides present

#### Test 4.2: Verify Agent Files

```bash
# Step 4.2.1: Check Emma agent
ls -lh _bmad/bme/_designos/agents/empathy-mapper.md

# Step 4.2.2: Check Wade agent
ls -lh _bmad/bme/_designos/agents/wireframe-designer.md

# Step 4.2.3: Verify Emma workflow steps
ls -la _bmad/bme/_designos/workflows/empathy-map/steps/

# Step 4.2.4: Verify Wade workflow steps
ls -la _bmad/bme/_designos/workflows/wireframe/steps/
```

**Expected Result:**
- Emma agent: ~7 KB
- Wade agent: ~7.7 KB
- Emma workflow: 6 step files
- Wade workflow: 6 step files

**Success Criteria:**
- [ ] All agent files present
- [ ] All workflow files present
- [ ] File sizes reasonable

#### Test 4.3: Verify User Guides

```bash
# Step 4.3.1: Check user guides
ls -lh _bmad-output/design-artifacts/

# Step 4.3.2: Verify Emma guide
head -20 _bmad-output/design-artifacts/EMMA-USER-GUIDE.md

# Step 4.3.3: Verify Wade guide
head -20 _bmad-output/design-artifacts/WADE-USER-GUIDE.md
```

**Expected Result:**
- EMMA-USER-GUIDE.md: ~19 KB
- WADE-USER-GUIDE.md: ~43 KB
- Both files readable with proper headers

**Success Criteria:**
- [ ] Emma guide exists and is readable
- [ ] Wade guide exists and is readable
- [ ] File sizes match expected

---

### Phase 5: Test Agent Activation

#### Test 5.1: Activate Emma

```bash
# Step 5.1.1: Read Emma agent file (simulates activation)
cat _bmad/bme/_designos/agents/empathy-mapper.md | head -30
```

**Expected Result:**
- Agent metadata visible
- Activation instructions present
- No errors reading file

**Success Criteria:**
- [ ] File reads successfully
- [ ] Contains agent configuration
- [ ] Contains activation instructions

#### Test 5.2: Activate Wade

```bash
# Step 5.2.1: Read Wade agent file (simulates activation)
cat _bmad/bme/_designos/agents/wireframe-designer.md | head -30
```

**Expected Result:**
- Agent metadata visible
- Activation instructions present
- No errors reading file

**Success Criteria:**
- [ ] File reads successfully
- [ ] Contains agent configuration
- [ ] Contains activation instructions

---

### Phase 6: Test Individual Installers (Clean Install)

#### Test 6.1: Emma Only

```bash
# Step 6.1.1: Create fresh test directory
mkdir -p /tmp/bmad-test-emma-only
cd /tmp/bmad-test-emma-only

# Step 6.1.2: Install BMAD Method
npx bmad-method@alpha install

# Step 6.1.3: Install Convoke
npm install convoke-agents@alpha

# Step 6.1.4: Install Emma only
npx convoke-install-emma

# Step 6.1.5: Verify only Emma installed
ls -la _bmad/bme/_designos/agents/
```

**Expected Result:**
- Only empathy-mapper.md exists
- No wireframe-designer.md
- Emma workflow files present
- Emma user guide installed

**Success Criteria:**
- [ ] Emma agent installed
- [ ] Wade agent NOT installed
- [ ] Emma workflow present
- [ ] Command succeeded

#### Test 6.2: Wade Only

```bash
# Step 6.2.1: Create fresh test directory
mkdir -p /tmp/bmad-test-wade-only
cd /tmp/bmad-test-wade-only

# Step 6.2.2: Install BMAD Method
npx bmad-method@alpha install

# Step 6.2.3: Install Convoke
npm install convoke-agents@alpha

# Step 6.2.4: Install Wade only
npx convoke-install-wade

# Step 6.2.5: Verify only Wade installed
ls -la _bmad/bme/_designos/agents/
```

**Expected Result:**
- Only wireframe-designer.md exists
- No empathy-mapper.md
- Wade workflow files present
- Wade user guide installed

**Success Criteria:**
- [ ] Wade agent installed
- [ ] Emma agent NOT installed
- [ ] Wade workflow present
- [ ] Command succeeded

---

### Phase 7: Test Error Handling

#### Test 7.1: Install Without BMAD Method

```bash
# Step 7.1.1: Create fresh directory (no BMAD Method)
mkdir -p /tmp/bmad-test-no-prereq
cd /tmp/bmad-test-no-prereq

# Step 7.1.2: Install Convoke
npm install convoke-agents@alpha

# Step 7.1.3: Try to install agents (should fail)
npx convoke-install
```

**Expected Result:**
- Error message displayed
- Clear instructions to install BMAD Method
- Exit code 1
- No files created

**Success Criteria:**
- [ ] Command fails gracefully
- [ ] Error message helpful
- [ ] Shows npx bmad-method@alpha install
- [ ] No partial installation

---

## Test Results Template

### Overall Results

- **Date Tested:** ___________
- **Tester:** ___________
- **Environment:** ___________

### Phase Results

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Create Repo | ⬜ PASS / ⬜ FAIL | |
| Phase 2: Install BMAD Method | ⬜ PASS / ⬜ FAIL | |
| Phase 3: Install Package | ⬜ PASS / ⬜ FAIL | |
| Phase 4: Test npx Commands | ⬜ PASS / ⬜ FAIL | |
| Phase 5: Test Activation | ⬜ PASS / ⬜ FAIL | |
| Phase 6: Individual Installers | ⬜ PASS / ⬜ FAIL | |
| Phase 7: Error Handling | ⬜ PASS / ⬜ FAIL | |

### Issues Found

1. ___________
2. ___________
3. ___________

### Recommendations

1. ___________
2. ___________
3. ___________

---

## Cleanup

```bash
# Remove test directories
rm -rf /tmp/convoke-test-repo
rm -rf /tmp/bmad-test-emma-only
rm -rf /tmp/bmad-test-wade-only
rm -rf /tmp/bmad-test-no-prereq
```

---

## Next Steps After Testing

If all tests pass:
- [ ] Document any edge cases found
- [ ] Update README with any clarifications needed
- [ ] Create release notes for v1.0.3-alpha

If tests fail:
- [ ] Document failure details
- [ ] Fix identified issues
- [ ] Re-test
- [ ] Bump version and republish
