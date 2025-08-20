#!/usr/bin/env bash

set -e

# Yarn 최신 버전 사용
yarn set version berry

npm install -g @vscode/vsce

# OpenVSX CLI 설치 (Cursor 등 다른 에디터용)
npm install -g ovsx

echo "✅ Node.js development tools installed:"
echo "  - Yarn (berry)"
echo "  - @vscode/vsce (VS Code Extension Manager)"
echo "  - ovsx (OpenVSX Registry CLI)"
