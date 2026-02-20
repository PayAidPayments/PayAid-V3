# PayAid Agent Browser Extension

AI-powered assistant for PayAid V3 that provides context-aware suggestions and quick actions.

## Installation

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `browser-extension` folder

## Configuration

1. Get your API key from PayAid Dashboard → Developer → API Keys
2. Click the extension icon
3. Click "Configure API Key"
4. Enter your API key and Tenant ID

## Features

- **Context-aware suggestions**: See relevant actions when viewing contacts or deals
- **Quick actions**: One-click task creation, deal creation, email sending
- **Floating action button**: Quick access from any PayAid page

## Usage

1. Navigate to a contact or deal page in PayAid
2. Click the floating ⚡ button or extension icon
3. See suggested actions based on context
4. Click "Execute" to perform actions

## Development

- `manifest.json` - Extension configuration
- `popup.html/js` - Extension popup UI
- `content.js` - Content script injected into PayAid pages
- `background.js` - Background service worker
