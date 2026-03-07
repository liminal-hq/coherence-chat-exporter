# Packaging and Distribution

This document outlines how `coherence-chat-exporter` is packaged and distributed.

## 1. NPM Distribution (Recommended)

The primary distribution method is via NPM.

### Installation
Users can install the tool globally:

```bash
npm install -g coherence-chat-exporter
```

Or run it directly via `npx`:

```bash
npx coherence-chat-exporter export ...
```

### Release Process
1.  Bump the version in `package.json`.
2.  Tag the commit (e.g., `v1.0.0`).
3.  Push the tag to GitHub.
4.  The GitHub Action will automatically:
    -   Build the project.
    -   Create a release on GitHub.
    -   Build and upload Bun standalone binaries for Linux/macOS/Windows with `.sha256` checksums.
    -   Upload the NPM tarball (`.tgz`), bundled script (`dist/coherence.bundle.mjs`), and Linux AppImages.

## 2. Standalone Bun Binary

A standalone executable can be built locally with Bun:

```bash
npm run build:binary
```

This produces `dist/coherence` (or `dist/coherence.exe` on Windows).

## 3. Standalone Bundle

 A single-file bundle is generated at `dist/coherence.bundle.mjs` during the release process. This file contains most dependencies bundled together (except for native modules like `onnxruntime-node`).

### Usage
You can run this bundle directly with Node.js:

```bash
 node coherence.bundle.mjs export --help
```

*Note: If you use features requiring native modules (like AI tagging), you must ensure `node_modules` are available or installed alongside the script.*

 ## 4. AppImage (Linux)

 A standalone AppImage for Linux is generated during the release. This is a self-contained executable that includes Node.js. Both `x64` and `arm64` architectures are supported.

 ### Usage
 1. Download `Coherence-x64.AppImage` (or `arm64`).
 2. Make it executable: `chmod +x Coherence-x64.AppImage`.
 3. Run it: `./Coherence-x64.AppImage export ...`

 *Note: AppImages do not automatically install shell completion. You must manually source the completion script as described below.*

 ## 5. Shell Completion

The tool supports generating completion scripts for Bash, Zsh, and Fish.

### Setup

**Bash:**
```bash
# Add to ~/.bashrc
source <(coherence completion bash)
```

**Zsh:**
```bash
# Add to ~/.zshrc
source <(coherence completion zsh)
```

**Fish:**
```bash
# Add to ~/.config/fish/config.fish
coherence completion fish | source
```
