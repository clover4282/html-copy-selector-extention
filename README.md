# Copy HTML for AI

**English** | [한국어](README.ko.md)

A Chrome extension that lets you **point at any element on a page and copy a compact "reference" about it** to your clipboard — then paste it to an AI (ChatGPT, Claude, …) and ask it to fix or explain that piece of UI.

Instead of dumping raw HTML, it copies exactly what an AI needs to *locate and debug* the element: a unique selector, what the element is, its size in the viewport, and the **key computed CSS** behind how it looks.

> **Chrome Web Store listing**
>
> _Point at any element and copy an AI-ready reference (selector + key CSS) to your clipboard, so you can ask an AI to fix or explain that part of the UI._
>
> No data is collected, stored, or transmitted — everything runs locally. See the [Privacy Policy](PRIVACY.md).

## How it works

Start **pick mode** (a DevTools-like "Inspect") in any of three ways:

- Click the **toolbar icon**
- Press the **shortcut** — default **Alt+Shift+C** (Mac: **Option+Shift+C**)
- Right-click → **Copy HTML for AI**

Then:

1. **Hover** — a blue outline and a label (tag + size) follow your cursor.
2. **Click** the element — its reference is copied, the element flashes green, and a toast shows the full copied text.
3. **Esc** (or the shortcut / icon again) cancels.

> The shortcut can be changed at `chrome://extensions/shortcuts`. The toolbar icon's tooltip shows the currently assigned key.

## What gets copied

A block of comments describing the element — **no HTML body**, just the reference an AI needs. Defaults, zero values, `static` positioning and transparent backgrounds are omitted, so only meaningful signal remains.

```html
<!-- AI UI-debugging reference for the element below. -->
<!-- page: https://example.com/products -->
<!-- selector: #content > div.list > div.card:nth-of-type(3) (unique on page) -->
<!-- element: a "Add to cart" → /cart/add?id=42 -->
<!-- class: card card--featured -->
<!-- size: 320×40px · viewport 1440×900 desktop -->
<!-- layout: display:flex; dir:row; justify:space-between; align:center; gap:8px -->
<!-- box: padding:8px 12px; border:1px solid #ddd; radius:6px -->
<!-- text: 14px/20px Inter; weight:600; color:#1a1a1a -->
<!-- visual: background:#ffffff; box-shadow -->
<!-- region: inside <main> "Recommended" -->
```

| Field | Meaning |
| --- | --- |
| **page** | Which screen this is (URL) |
| **selector** | Pinpoints *which one* even when several look alike, plus a `unique on page` check. Never truncated. |
| **element** | Tag, role, accessible name, aria state, link/input value — "what this is". Container elements skip the noisy concatenated text. |
| **class** | Every class actually applied (the selector keeps only stable ones; debugging needs the full set) |
| **size** | Rendered size in CSS px, plus the viewport size and form factor (desktop/mobile) so the size is meaningful |
| **layout** | `display`, plus flex/grid alignment & `gap`, and `overflow` when set |
| **box** | padding / margin / border / radius — only the non-zero parts |
| **text** | font size/line-height/family, weight, color |
| **visual** | background, opacity, shadow — only when set |
| **positioning** | position / z-index / insets — only when not `static` |
| **region** | The nearest landmark (header/nav/main, etc.) and that region's title |
| **⚠ not visible / off-screen** | Shown **only** when the element is hidden or off-screen, with the concrete reason (`display:none`, etc.) |

### How selectors are built

Unlike DevTools' "Copy selector", **hash classes that change on every build are excluded**, producing reproducible selectors.

| Kind | Example | Handling |
| --- | --- | --- |
| Stable id | `#newsstand` | Used (ends the path) |
| Stable attribute | `data-testid`, `name`, `aria-label` | Preferred |
| Plain class | `.card`, `.news_desc` | Used |
| CSS Modules / styled-components / emotion | `...module__x___AiQyW`, `sc-abc123`, `css-1a2b3c` | **Excluded** → replaced with `:nth-of-type` |

## Installation

### From the Chrome Web Store

Once published, install it directly from the Chrome Web Store. _(Link will be added here after review.)_

### Developer mode (load unpacked)

1. Open `chrome://extensions` in Chrome
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder

## Usage

Start pick mode (toolbar icon, **Alt+Shift+C**, or right-click → **Copy HTML for AI**), hover the element, click it, then paste into your AI chat.

## File structure

- `manifest.json` — Extension config (Manifest V3, `contextMenus` permission, toolbar `action`, pick-mode keyboard `command`)
- `background.js` — Registers the single right-click menu item, handles the toolbar icon / shortcut / menu (all start pick mode), and keeps the icon tooltip's shortcut up to date
- `content.js` — Runs pick mode (hover highlight + click to copy), builds the metadata/CSS reference, copies to clipboard, and shows the highlight/toast

## Notes

- The entire package — UI text, copied reference, and code comments — is in English.
- Works across all frames, so elements inside iframes can be copied too.
- Only meaningful CSS is included; defaults and zero values are dropped to keep the output short.

## Privacy

This extension does not collect, store, or transmit any user data. All processing happens locally in your browser. See [PRIVACY.md](PRIVACY.md) for details.
