# How to Create GitHub Release v1.0.2-alpha

## Option 1: Using GitHub Web Interface (Recommended)

1. **Go to the releases page:**
   https://github.com/amalik/convoke-agents/releases/new

2. **Fill in the form:**
   - **Tag version:** `v1.0.2-alpha`
   - **Target:** `main`
   - **Release title:** `Convoke v1.0.2-alpha - Bug Fixes`
   - **Description:** Copy the contents from `RELEASE-NOTES-v1.0.2-alpha.md`
   - **Check:** ✅ "This is a pre-release"

3. **Publish release**

## Option 2: Using gh CLI (After Authentication)

First, authenticate with GitHub:
```bash
gh auth login
```

Then create the release:
```bash
gh release create v1.0.2-alpha \
  --title "Convoke v1.0.2-alpha - Bug Fixes" \
  --notes-file RELEASE-NOTES-v1.0.2-alpha.md \
  --prerelease \
  --target main
```

## Option 3: Push First, Then Create Release

If you need to push the commits first:
```bash
# Push commits to GitHub
git push

# Then create release using one of the methods above
```

## What Happens After Release

Once the release is created:
- ✅ GitHub will tag the commit as `v1.0.2-alpha`
- ✅ Release will appear on your repository's releases page
- ✅ Users can download the source code
- ✅ Release notes will be visible
- ✅ npm package link will be in the release notes

## Current Status

- ✅ npm package published (v1.0.2-alpha)
- ✅ All tests passing
- ✅ Release notes prepared
- ⏳ GitHub release needs to be created
- ⏳ Commits need to be pushed to GitHub

## Quick Link

After creating the release, it will be available at:
https://github.com/amalik/convoke-agents/releases/tag/v1.0.2-alpha
