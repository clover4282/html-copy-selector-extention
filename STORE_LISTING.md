# Chrome Web Store Submission Guide

Upload package: `html-copy-selector-v1.0.0.zip`

## Steps

1. Go to https://chrome.google.com/webstore/devconsole (sign in with a Google account)
2. Pay the one-time **$5 developer registration fee** (first time only)
3. **New item** → upload `html-copy-selector-v1.0.0.zip`
4. Fill in the store listing below
5. **Submit for review** — usually takes a few hours to a few days

---

## Store Listing

**Name**: HTML Copy Selector

**Summary (short description, max 132 chars)**
Right-click any element to copy its HTML to your clipboard, so you can easily explain a page to an AI.

**Detailed description**
Right-click any element on a web page and a "Copy HTML for AI" menu appears.

- This element (cleaned up) — copies tidy HTML with noise attributes stripped out
- This element (raw outerHTML) — copies the original outerHTML as-is
- Parent element (one level up) — copies the element one level up

Paste the copied HTML into ChatGPT, Claude, or any AI assistant to make requests like "fix this part" or "explain this layout" with precise context.

**Category**: Developer Tools

**Language**: English

---

## Privacy

During review you'll be asked to justify permissions. Use these answers:

- **contextMenus permission**: used to add an item to the right-click context menu.
- **host permission (<all_urls>)**: used to read the HTML of the element you right-click and copy it to the clipboard.
- **Data collection**: none. Everything runs locally; no data is sent anywhere.
- **Remote code**: none.

If a privacy policy URL is required, publish a single line on your README or GitHub Pages:
"This extension does not collect, store, or transmit any user data."

---

## Visual assets you must prepare yourself (required/recommended)

These screenshots are NOT in the ZIP — upload them separately in the dashboard:

- **Screenshot (required)**: 1280×800 or 640×400, at least 1
  → Capture a page with the right-click menu open.
- **Small promo tile (recommended)**: 440×280

The 128×128 icon is already bundled in the package — no separate upload needed.
