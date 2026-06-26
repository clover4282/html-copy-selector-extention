# Chrome Web Store Submission Guide

Upload package: `copy-html-for-ai-v1.1.0.zip`

## Steps

1. Go to https://chrome.google.com/webstore/devconsole (sign in with a Google account)
2. Pay the one-time **$5 developer registration fee** (first time only)
3. **New item** (or a new version of the existing item) → upload `copy-html-for-ai-v1.1.0.zip`
4. Fill in the store listing below
5. **Submit for review** — usually takes a few hours to a few days

---

## Store Listing

**Name**: Copy HTML for AI

**Summary (short description, max 132 chars)**
Point at any element and copy an AI-ready reference (selector + key CSS) so you can ask an AI to fix or explain that UI.

**Detailed description**
Point at any element on a web page and copy a compact reference about it — then paste it to an AI (ChatGPT, Claude, etc.) and ask it to fix or explain that part of the UI.

Start pick mode (DevTools-like "Inspect") in three ways:
- Click the toolbar icon
- Press the shortcut (default Alt+Shift+C, Mac Option+Shift+C)
- Right-click → Copy HTML for AI

Then hover to highlight an element and click to copy. Instead of dumping raw HTML, it copies exactly what an AI needs to locate and debug the element:
- a reproducible unique selector (build-specific hash classes excluded)
- what the element is (tag, role, accessible name, applied classes)
- its size and the viewport size / form factor
- the key computed CSS behind how it looks (layout, box model, typography, background, positioning)

Only meaningful values are included — defaults and zeros are dropped — so the output stays short and readable.

**Category**: Developer Tools

**Language**: English

---

## Privacy

During review you'll be asked to justify permissions. Use these answers:

- **contextMenus permission**: used to add a "Copy HTML for AI" item to the right-click menu that starts pick mode.
- **host access (content script on <all_urls>)**: used to read the picked element (its selector, computed styles, etc.) on the page and copy that reference to the clipboard.
- **Data collection**: none. Everything runs locally; no data is sent anywhere.
- **Remote code**: none.

If a privacy policy URL is required, publish a single line on your README or GitHub Pages:
"This extension does not collect, store, or transmit any user data."

---

## Visual assets you must prepare yourself (required/recommended)

These screenshots are NOT in the ZIP — upload them separately in the dashboard:

- **Screenshot (required)**: 1280×800 or 640×400, at least 1
  → Capture pick mode in action (the blue hover outline + label), or the copied toast.
- **Small promo tile (recommended)**: 440×280

The 128×128 icon is already bundled in the package — no separate upload needed.
