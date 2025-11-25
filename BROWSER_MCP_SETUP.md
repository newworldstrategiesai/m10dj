# Browser MCP Extension Setup Guide

## Overview
The Browser MCP extension allows AI assistants in Cursor to interact with your browser for testing and automation.

## Step 1: Install Browser Extension

### Chrome/Edge:
1. Go to Chrome Web Store: https://chrome.google.com/webstore
2. Search for "Browser MCP" or "Cursor Browser Extension"
3. Click "Add to Chrome"
4. Confirm installation

### Alternative: Manual Installation
If the extension isn't in the store, you may need to:
1. Download the extension source code
2. Enable "Developer mode" in Chrome extensions
3. Click "Load unpacked" and select the extension folder

## Step 2: Pin the Extension

1. Click the puzzle piece icon in Chrome toolbar
2. Find "Browser MCP" or "Cursor Browser Extension"
3. Click the pin icon to keep it visible

## Step 3: Configure in Cursor

### Option A: Automatic Configuration (if supported)
1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Go to "Features" → "MCP Servers" or "Extensions"
3. Look for "Browser Extension" or "Browser MCP"
4. Enable it if available

### Option B: Manual MCP Configuration
1. Open Cursor Settings
2. Navigate to MCP settings (usually in `~/.cursor/mcp.json` or Cursor settings)
3. Add the browser extension server configuration

## Step 4: Connect the Extension

1. Open a browser tab
2. Click the Browser MCP extension icon in your toolbar
3. Click "Connect" or "Start Server"
4. The extension should show "Connected" status

## Step 5: Test the Connection

In Cursor, try using browser commands:
- `@Browser navigate to http://localhost:3001`
- The AI should be able to interact with your browser

## Troubleshooting

### Extension Not Found
- Check if you're using a supported browser (Chrome, Edge, or Chromium-based)
- Try searching for "MCP Browser" or "Cursor Browser" in the store

### Connection Issues
- Make sure the extension is enabled
- Check that the extension has necessary permissions
- Restart Cursor after installing the extension
- Restart your browser

### MCP Server Not Available
- The browser extension needs to be running as an MCP server
- Check Cursor's MCP server list in settings
- Ensure the extension is properly configured

## Alternative: Manual Testing

If the browser extension isn't working, you can:
1. Manually test pages at `http://localhost:3001`
2. Use the terminal to check server status
3. Review code changes directly in the editor

## Current Status

✅ **Server Running**: `http://localhost:3001`
✅ **Admin Pricing Page**: `/admin/pricing`
✅ **Code Updated**: All improvements are in place

You can manually test the admin pricing page by:
1. Opening `http://localhost:3001/admin/pricing` in your browser
2. Logging in as admin
3. Testing the new Summary tab and features

