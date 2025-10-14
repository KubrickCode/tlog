#!/bin/bash

npm install -g @anthropic-ai/claude-code
npm install -g prettier
npm install -g baedal
npm install -g @vscode/vsce
npm install -g ovsx

if [ -f /workspaces/tlog/.env ]; then
  grep -v '^#' /workspaces/tlog/.env | sed 's/^/export /' >> ~/.bashrc
fi
