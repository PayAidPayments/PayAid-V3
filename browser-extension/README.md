# PayAid V3 Browser Extension

Quick access to PayAid V3 from any webpage.

## Features

- **Quick Actions**: Access Dashboard, Deals, Contacts, Tasks, AI Co-Founder
- **Live Stats**: View active deals, pending tasks, and new leads
- **Floating Widget**: Quick access button on any webpage
- **Context Menu**: Right-click to create contacts or deals from selected text
- **Contact Detection**: Auto-detect emails and phone numbers on pages

## Installation

1. Open Chrome/Edge browser
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `browser-extension` folder

## Configuration

1. Click the extension icon
2. Set your PayAid base URL (default: http://localhost:3000)
3. Login to PayAid and the extension will store your auth token

## Usage

- **Popup**: Click extension icon for quick access
- **Floating Widget**: Click the floating button on any webpage
- **Context Menu**: Right-click selected text → "Create Contact/Deal in PayAid"

## Development

- `manifest.json` - Extension configuration
- `popup.html/js` - Extension popup UI
- `background.js` - Service worker for background tasks
- `content.js` - Content script injected into web pages
