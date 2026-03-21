#!/bin/bash
# Patch the Electron.app Info.plist so macOS menu bar shows "Lyra" instead of "Electron"
PLIST="node_modules/electron/dist/Electron.app/Contents/Info.plist"
if [ -f "$PLIST" ]; then
  plutil -replace CFBundleName -string "Lyra" "$PLIST" 2>/dev/null
  plutil -replace CFBundleDisplayName -string "Lyra" "$PLIST" 2>/dev/null
fi
