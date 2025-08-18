#!/usr/bin/env bash

set -e

# Yarn 최신 버전 사용
yarn set version berry

npm install -g @vscode/vsce

echo "✅ Node.js development tools installed:"
echo "  - Yarn (berry)"
echo "  - @vscode/vsce (VS Code Extension Manager)"
