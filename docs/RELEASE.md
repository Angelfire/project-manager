# Release Guide

This guide outlines the complete process for creating and distributing RunStack releases for macOS using **GitHub Actions only**.

## Overview

Releases are automatically built and published using GitHub Actions. All releases are automated:

- **Build**: Universal binary for macOS (Intel + Apple Silicon)
- **Package**: DMG file for easy installation
- **Publish**: Automatically creates GitHub Release with release notes from CHANGELOG.md

**To create a new release:**

1. Update version numbers using `pnpm run prepare-release vX.Y.Z`
2. Update CHANGELOG.md with release date
3. Commit and push tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z" && git push origin main --tags`
4. GitHub Actions automatically builds and publishes the release

## Prerequisites

### Required Files

- ✅ Icons in `src-tauri/icons/` (icon.icns, icon.ico, PNG files)
- ✅ `CHANGELOG.md` with proper format and release date
- ✅ `.github/workflows/release.yml` configured

## How GitHub Actions Release Works

The `.github/workflows/release.yml` workflow automatically handles the entire release process:

1. **Trigger**: Activated by pushing a tag (`v*`) or via workflow dispatch
2. **Build**: Creates macOS universal binary (Intel + Apple Silicon)
3. **Package**: Generates DMG file
4. **Release**: Creates GitHub Release with notes from CHANGELOG.md
5. **Upload**: Attaches DMG and .app files to the release

**No manual build or upload required** - everything is automated.

## Release Process (GitHub Actions Only)

All releases are handled automatically by GitHub Actions. You have two options:

### Option 1: Release via Tag Push (Recommended)

1. **Prepare Release Locally** (update versions and CHANGELOG):

   ```bash
   pnpm run prepare-release v0.1.0
   ```

2. **Review and Commit Changes**:

   ```bash
   git diff
   git add .
   git commit -m "chore: release v0.1.0"
   ```

3. **Create and Push Tag**:

   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin main --tags
   ```

4. **GitHub Actions Automatically**:
   - ✅ Detects the tag push
   - ✅ Builds macOS universal binary (Intel + Apple Silicon)
   - ✅ Creates DMG file
   - ✅ Extracts release notes from CHANGELOG.md
   - ✅ Creates GitHub Release
   - ✅ Uploads artifacts (DMG and .app)

### Option 2: Release via Workflow Dispatch

1. **Prepare Release Locally** (update versions and CHANGELOG):

   ```bash
   pnpm run prepare-release v0.1.0
   ```

2. **Commit and Push Changes**:

   ```bash
   git add .
   git commit -m "chore: prepare release v0.1.0"
   git push origin main
   ```

3. **Trigger Release via GitHub UI**:
   - Go to GitHub Actions → "Release Build" workflow
   - Click "Run workflow"
   - Select branch: `main`
   - Enter version: `v0.1.0` (must match CHANGELOG)
   - Click "Run workflow"

4. **GitHub Actions Automatically**:
   - ✅ Builds macOS universal binary
   - ✅ Creates DMG file
   - ✅ Extracts release notes from CHANGELOG.md
   - ✅ Creates GitHub Release with the specified tag
   - ✅ Uploads artifacts (DMG and .app)

## Post-Release Verification

After the GitHub Actions workflow completes:

- [ ] Check GitHub Release was created
- [ ] Verify DMG file is downloadable
- [ ] Test DMG on a clean macOS system
- [ ] Verify app launches correctly
- [ ] Check version number in app

## Local Testing (Before Release)

Before creating a release, test the build locally:

```bash
# Build with macOS-specific configuration
pnpm tauri build --config src-tauri/tauri.macos.conf.json --bundles app,dmg --target universal-apple-darwin

# Test the built app
open src-tauri/target/universal-apple-darwin/release/bundle/macos/RunStack.app
```

**Note**: This is only for testing. All production releases are built automatically by GitHub Actions.

## CHANGELOG Format

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- New features

### Changed

- Changes in existing functionality

### Fixed

- Bug fixes

### Security

- Security fixes
```

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., `1.0.0`)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Pre-Release Checklist

Before pushing the tag or triggering workflow dispatch:

- [ ] All changes committed to `main` branch
- [ ] Version updated in all files (package.json, Cargo.toml, tauri.conf.json)
- [ ] CHANGELOG.md updated with release date (format: `## [0.1.0] - 2025-01-XX`)
- [ ] All tests pass (`pnpm test:run`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Local build works (`pnpm tauri build`)
- [ ] App runs correctly locally
- [ ] Icons are present and correct
- [ ] Version in CHANGELOG matches the tag version (e.g., `v0.1.0` → `## [0.1.0]`)

## Code Signing (Optional)

⚠️ **Note**: This project does NOT use code signing by default. Users may see security warnings on macOS.

To enable code signing:

1. **Get Apple Developer Certificate** ($99/year)
2. **Configure in `tauri.macos.conf.json`**:
   ```json
   {
     "bundle": {
       "macOS": {
         "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
         "hardenedRuntime": true,
         "entitlements": "entitlements.plist"
       }
     }
   }
   ```
3. **Find your signing identity**:
   ```bash
   security find-identity -v -p codesigning
   ```

## Troubleshooting

### Build fails with "target not found"

```bash
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
```

### DMG not created

Verify `tauri.macos.conf.json` has `"targets": ["app", "dmg"]` in bundle configuration.

### Release notes not generated

Ensure CHANGELOG.md has a section matching the version:

```markdown
## [0.1.0] - 2025-01-XX
```

### Version mismatch

Ensure all version fields are synchronized:

- `package.json`: `"version": "0.1.0"`
- `src-tauri/Cargo.toml`: `version = "0.1.0"`
- `src-tauri/tauri.conf.json`: `"version": "0.1.0"`

## What Gets Built

### macOS Release

- **Universal Binary**: Works on both Intel (x86_64) and Apple Silicon (aarch64) Macs
- **DMG File**: Disk image for easy installation
- **.app Bundle**: Application bundle for Applications folder

### Build Artifacts

After build completes, artifacts are available in:

- GitHub Release page (downloadable files)
- GitHub Actions artifacts (temporary, 30 days retention)

## Security Notes

Without code signing:

- Users may see security warnings
- Users can right-click app → "Open" the first time
- Or go to System Settings → Privacy & Security → Allow the app

For production releases, consider obtaining an Apple Developer certificate.

## Quick Reference

### Complete Release Workflow (GitHub Actions)

```bash
# 1. Prepare release (updates all versions and CHANGELOG)
pnpm run prepare-release v0.1.0

# 2. Review changes
git diff

# 3. Commit and push
git add .
git commit -m "chore: release v0.1.0"
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin main --tags

# 4. GitHub Actions automatically:
#    - Builds universal binary
#    - Creates DMG
#    - Creates GitHub Release
#    - Uploads artifacts
```

### Workflow Dispatch Alternative

```bash
# 1. Prepare and commit (without tag)
pnpm run prepare-release v0.1.0
git add .
git commit -m "chore: prepare release v0.1.0"
git push origin main

# 2. Go to GitHub Actions → "Release Build" → "Run workflow"
#    Enter version: v0.1.0
```

### Local Testing

```bash
# Test build before release
pnpm tauri build --config src-tauri/tauri.macos.conf.json --bundles app,dmg --target universal-apple-darwin
open src-tauri/target/universal-apple-darwin/release/bundle/macos/RunStack.app
```

## GitHub Actions Workflow Details

The release workflow (`.github/workflows/release.yml`) performs these steps:

### Build Job (`build-release`)

- Runs on `macos-latest`
- Sets up Node.js 20, pnpm 9, and Rust
- Installs dependencies
- Builds universal binary for both Intel and Apple Silicon
- Creates DMG file
- Uploads artifacts

### Release Job (`create-release`)

- Runs after build completes
- Extracts version from tag or workflow input
- Generates release notes from CHANGELOG.md
- Creates GitHub Release
- Uploads DMG and .app files

### Workflow Triggers

1. **Tag Push**: `git push origin main --tags` with tag matching `v*`
2. **Workflow Dispatch**: Manual trigger via GitHub UI with version input

## Additional Resources

- [Tauri Building Documentation](https://v2.tauri.app/guides/building/)
- [Tauri DMG Distribution Guide](https://v2.tauri.app/distribute/dmg/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
