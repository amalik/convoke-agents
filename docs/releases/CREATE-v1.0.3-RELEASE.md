# Create GitHub Release for v1.0.3-alpha

**Version:** v1.0.3-alpha
**Date:** 2026-02-15
**Status:** Ready to create

---

## Prerequisites

- [x] Package published to npm ✅
- [x] All commits made locally ✅
- [x] Release notes created ✅
- [ ] Commits pushed to GitHub
- [ ] GitHub release created

---

## Step 1: Push Commits to GitHub

You have **1 local commit** that needs to be pushed:

```bash
git push
```

**Commit to be pushed:**
- `0aacaab` - Update Wade status to complete in README

After pushing, verify at:
https://github.com/amalik/convoke-agents/commits/main

---

## Step 2: Create GitHub Release

### Option A: Using gh CLI (Recommended)

**Run the provided script:**
```bash
./create-github-release.sh
```

**Or manually:**
```bash
gh release create v1.0.3-alpha \
  --title "Convoke v1.0.3-alpha - User-Friendly npx Installation" \
  --notes-file RELEASE-NOTES-v1.0.3-alpha.md \
  --prerelease \
  --target main
```

### Option B: Using GitHub Web Interface

1. Go to: https://github.com/amalik/convoke-agents/releases/new

2. Fill in the form:
   - **Tag:** `v1.0.3-alpha`
   - **Target:** `main`
   - **Release title:** `Convoke v1.0.3-alpha - User-Friendly npx Installation`
   - **Description:** Copy contents from `RELEASE-NOTES-v1.0.3-alpha.md`
   - **Pre-release:** ✅ Check this box

3. Click "Publish release"

---

## Release Notes Preview

The release notes include:

### Highlights
- 🎉 User-friendly npx installation commands
- ✨ Three new executable commands
- 📚 Complete documentation updates
- 🧪 100% test pass rate
- 📦 Both agents complete and published

### Key Features
- `npx convoke-install` - Install all agents
- `npx convoke-install-emma` - Install Emma only
- `npx convoke-install-wade` - Install Wade only

### Full Release Notes
See: [RELEASE-NOTES-v1.0.3-alpha.md](RELEASE-NOTES-v1.0.3-alpha.md)

---

## Step 3: Verify Release

After creating the release:

1. **Check release page:**
   https://github.com/amalik/convoke-agents/releases/tag/v1.0.3-alpha

2. **Verify npm package:**
   ```bash
   npm view convoke-agents@alpha
   # Should show: 1.0.3-alpha
   ```

3. **Test installation:**
   ```bash
   mkdir -p /tmp/test-release
   cd /tmp/test-release
   mkdir -p _bmad/_config && echo "test: true" > _bmad/_config/bmad.yaml
   npm install convoke-agents@alpha
   npx convoke-install
   ```

---

## Step 4: Announce (Optional)

### Social Media Post Template

```
🎉 Convoke v1.0.3-alpha released!

✨ What's new:
- User-friendly npx installation
- No more npm run confusion!
- Just: npm install convoke-agents@alpha && npx convoke-install

🎨 Includes:
- Emma (empathy-mapper)
- Wade (wireframe-designer)

📦 Install: https://www.npmjs.com/package/convoke-agents
📖 Docs: https://github.com/amalik/convoke-agents
🔖 Release: https://github.com/amalik/convoke-agents/releases/tag/v1.0.3-alpha

#BMAD #AI #Agents #DesignThinking #UX
```

### GitHub Discussion Post Template

```markdown
# Convoke v1.0.3-alpha Released! 🎉

We're excited to announce the release of Convoke v1.0.3-alpha!

## What's New

The biggest improvement is **user-friendly installation**. No more confusion about npm scripts!

**New Installation:**
\`\`\`bash
npm install convoke-agents@alpha
npx convoke-install  # This works now!
\`\`\`

## What's Included

- ✅ Emma (empathy-mapper) - Empathy Mapping Specialist
- ✅ Wade (wireframe-designer) - Wireframe Design Expert
- ✅ 100% test pass rate (46/46 tests)
- ✅ Comprehensive user guides

## Links

- 📦 npm: https://www.npmjs.com/package/convoke-agents
- 🔖 Release Notes: https://github.com/amalik/convoke-agents/releases/tag/v1.0.3-alpha
- 📖 Documentation: https://github.com/amalik/convoke-agents

## Feedback

We'd love to hear your thoughts! Try it out and let us know how it goes.
```

---

## Troubleshooting

### Issue: gh CLI not authenticated

**Solution:**
```bash
gh auth login
# Follow the prompts
```

### Issue: Can't push to GitHub

**Solution:**
```bash
# Check remote
git remote -v

# If using HTTPS, you may need to authenticate
# Consider switching to SSH:
git remote set-url origin git@github.com:amalik/Convoke.git
```

### Issue: Release already exists

**Solution:**
```bash
# Delete the release
gh release delete v1.0.3-alpha

# Delete the tag
git tag -d v1.0.3-alpha
git push origin :refs/tags/v1.0.3-alpha

# Try again
./create-github-release.sh
```

---

## Quick Commands Reference

```bash
# Push commits
git push

# Create release (gh CLI)
./create-github-release.sh

# Or manually
gh release create v1.0.3-alpha \
  --title "Convoke v1.0.3-alpha - User-Friendly npx Installation" \
  --notes-file RELEASE-NOTES-v1.0.3-alpha.md \
  --prerelease \
  --target main

# Verify
gh release view v1.0.3-alpha
npm view convoke-agents@alpha
```

---

## Checklist

**Before Creating Release:**
- [x] All code changes committed
- [x] Package published to npm (v1.0.3-alpha)
- [x] Release notes written
- [x] Documentation updated
- [x] Tests passing
- [ ] Commits pushed to GitHub

**Creating Release:**
- [ ] Run `git push`
- [ ] Run `./create-github-release.sh` or use web interface
- [ ] Verify release created

**After Creating Release:**
- [ ] Test installation from npm
- [ ] Update any external documentation
- [ ] Announce on social media (optional)
- [ ] Monitor for issues

---

## Next Steps After Release

1. **Monitor Issues:**
   - Watch for user feedback
   - Respond to questions promptly

2. **Plan Next Version:**
   - Sage (quality-gatekeeper) agent
   - Stan (standards-auditor) agent

3. **Consider Promotion:**
   - After user testing, promote to stable (1.0.0)
   - Update dist-tag from alpha to latest

---

**Ready to create the release? Run:**
```bash
git push && ./create-github-release.sh
```

Good luck! 🚀
