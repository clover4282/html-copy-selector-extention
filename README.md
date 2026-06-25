# HTML Copy Selector

**English** | [한국어](README.ko.md)

A Chrome extension that **copies the HTML of any right-clicked element** to your clipboard.
It saves you from manually retyping "this part looks like…" when explaining a page's structure to an AI.

## Features

Right-click an element to reveal three items under the **Copy HTML for AI ▸** menu.

| Menu item | What it copies |
| --- | --- |
| **This element (cleaned up)** | Strips `script`/`style`, shortens long attribute values, and pretty-prints — ideal for pasting into an AI |
| **This element (raw outerHTML)** | The element's original `outerHTML`, untouched |
| **Parent element (one level up)** | When an inner element got grabbed by mistake, copies its parent (cleaned up) |

After copying, the captured element is briefly **outlined in green** on the page, and a toast in the bottom-right tells you what was copied — so you immediately notice if the wrong element was grabbed.

### Metadata header

Each copy is prefixed with comments that help the AI understand the screen.

```html
<!-- page: https://example.com/products -->
<!-- selector: #content > div.list > div.card:nth-of-type(3) (unique on page) -->
<!-- element: a "Add to cart" → /cart/add?id=42 -->
<!-- position: 320×40px · middle right of viewport -->
<!-- region: inside <main> "Recommended" -->
<div class="card">…</div>
```

| Field | Meaning |
| --- | --- |
| **page** | Which screen this is (URL) |
| **selector** | Pinpoints *which one* even when several look alike, plus a `unique on page` check |
| **element** | Tag, role, accessible name, aria state, link/input value — "what this is" |
| **position** | On-screen size and location, plus **hidden / off-viewport status** (decisive for "it's not showing up" issues) |
| **region** | The nearest landmark (header/nav/main, etc.) and that region's title |

### How selectors are built

Unlike DevTools' "Copy selector", **hash classes that change on every build are excluded**, producing reproducible selectors.

| Kind | Example | Handling |
| --- | --- | --- |
| Stable id | `#newsstand` | Used (ends the path) |
| Stable attribute | `data-testid`, `name`, `aria-label` | Preferred |
| Plain class | `.card`, `.news_desc` | Used |
| CSS Modules / styled-components / emotion | `...module__x___AiQyW`, `sc-abc123`, `css-1a2b3c` | **Excluded** → replaced with `:nth-of-type` |

## Installation (developer mode)

1. Open `chrome://extensions` in Chrome
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder

## Usage

1. Hover over the element you want to describe on any web page and **right-click**
2. Pick an item from **Copy HTML for AI ▸**
3. Paste into your AI chat

## File structure

- `manifest.json` — Extension config (Manifest V3, `contextMenus` permission)
- `background.js` — Registers the context menu and handles clicks
- `content.js` — Tracks the right-clicked element, extracts/cleans HTML, builds the metadata header, copies to clipboard, and shows the highlight/toast

## Notes

- On-screen toasts/menus and the copied header are all in English; only the code comments are in Korean.
- Works across all frames, so elements inside iframes can be copied too.
- In cleanup mode, attribute values longer than 100 characters (e.g. base64 images) are truncated with `…`.
