// Track the most recently right-clicked element.
// Recorded during the capture phase (deepest target) and used when a menu item is clicked.
let lastRightClicked = null;

document.addEventListener(
  "contextmenu",
  (event) => {
    lastRightClicked = event.target;
  },
  true
);

// Handle the menu-click message sent from background.js.
chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== "COPY_ELEMENT") return;

  let target = lastRightClicked;
  if (!target || target.nodeType !== Node.ELEMENT_NODE) {
    showToast("No element found. Right-click directly on an element and try again.", false);
    return;
  }

  // "Parent element" menu: copy one level up when a small inner element was picked by mistake.
  if (message.action === "copy-parent-clean") {
    if (!target.parentElement || target.parentElement === document.documentElement) {
      showToast("No parent element to go up to.", false);
      return;
    }
    target = target.parentElement;
  }
  const mode = message.action === "copy-outerhtml" ? "outer" : "clean";

  let html;
  try {
    html = mode === "outer" ? target.outerHTML : cleanSerialize(target);
  } catch (err) {
    showToast("Failed to extract HTML.", false);
    return;
  }

  // Prepend a header with the page URL, a unique selector, and element info so the AI can
  // understand which element on which page it is, and where/how it appears on screen.
  const payload = buildHeader(target) + html;

  copyToClipboard(payload)
    .then(() => {
      highlight(target); // Highlight the copied element so the user can immediately see if the wrong one was picked.
      showToast(`Copied · ${describe(target)} (${payload.length.toLocaleString()} chars)`, true);
    })
    .catch(() => {
      showToast("Failed to copy to clipboard.", false);
    });
});

// ---------------------------------------------------------------------------
// HTML cleanup: reduce noise and re-indent so the result is easy to explain to an AI.
// ---------------------------------------------------------------------------
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);
const NOISE_TAGS = new Set(["script", "style", "noscript"]);

function cleanSerialize(root) {
  const lines = [];
  walk(root, 0, lines);
  return lines.join("\n");
}

function walk(node, depth, lines) {
  const pad = "  ".repeat(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.replace(/\s+/g, " ").trim();
    if (text) lines.push(pad + text);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const tag = node.tagName.toLowerCase();
  if (NOISE_TAGS.has(tag)) return; // skip script/style and similar tags entirely

  const attrs = formatAttrs(node);

  // For tags with large inner data (e.g. svg), collapse the children.
  if (tag === "svg") {
    lines.push(`${pad}<svg${attrs}>…</svg>`);
    return;
  }

  if (VOID_ELEMENTS.has(tag)) {
    lines.push(`${pad}<${tag}${attrs}>`);
    return;
  }

  const children = Array.from(node.childNodes).filter((c) => {
    if (c.nodeType === Node.TEXT_NODE) return c.textContent.trim() !== "";
    if (c.nodeType === Node.ELEMENT_NODE) {
      return !NOISE_TAGS.has(c.tagName.toLowerCase());
    }
    return false;
  });

  if (children.length === 0) {
    lines.push(`${pad}<${tag}${attrs}></${tag}>`);
    return;
  }

  // Collapse to a single line when there is only one text child.
  if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
    const text = children[0].textContent.replace(/\s+/g, " ").trim();
    lines.push(`${pad}<${tag}${attrs}>${text}</${tag}>`);
    return;
  }

  lines.push(`${pad}<${tag}${attrs}>`);
  for (const child of children) walk(child, depth + 1, lines);
  lines.push(`${pad}</${tag}>`);
}

function formatAttrs(el) {
  const parts = [];
  for (const attr of el.attributes) {
    let value = attr.value;
    // Truncate base64 / very long values (not needed to understand structure).
    if (value.length > 100) value = value.slice(0, 97) + "…";
    parts.push(value === "" ? attr.name : `${attr.name}="${value}"`);
  }
  return parts.length ? " " + parts.join(" ") : "";
}

// ---------------------------------------------------------------------------
// Metadata header: page URL + unique selector + match count
// ---------------------------------------------------------------------------
function buildHeader(el) {
  const selector = buildSelector(el);
  let count = -1;
  try {
    count = document.querySelectorAll(selector).length;
  } catch (_) {
    // Skip the count check in the rare case the selector is invalid.
  }
  const match =
    count === 1 ? "unique on page"
    : count > 1 ? `${count} matches on page`
    : "position unknown";

  const lines = [
    `<!-- page: ${location.href} -->`,
    `<!-- selector: ${selector} (${match}) -->`,
    `<!-- element: ${describeElement(el)} -->`,
    `<!-- position: ${describePosition(el)} -->`,
  ];
  const region = describeRegion(el);
  if (region) lines.push(`<!-- region: ${region} -->`);
  if (window.top !== window.self) {
    lines.push(`<!-- inside an iframe -->`);
  }
  return lines.join("\n") + "\n";
}

// Trim to a short, human-readable length.
function shorten(s, max) {
  s = (s || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// The element's "identity": tag + role + accessible name (+ link/input extras).
function describeElement(el) {
  const tag = el.tagName.toLowerCase();
  let s = tag;
  const role = el.getAttribute("role");
  if (role) s += ` role=${role}`;

  const name = shorten(
    el.getAttribute("aria-label") ||
      el.getAttribute("alt") ||
      el.getAttribute("title") ||
      el.getAttribute("placeholder") ||
      el.innerText ||
      el.textContent ||
      "",
    50
  );
  if (name) s += ` "${name}"`;

  const states = ariaStates(el);
  if (states) s += ` [${states}]`;

  if (tag === "a" && el.getAttribute("href")) s += ` → ${shorten(el.getAttribute("href"), 60)}`;
  if (tag === "input" || tag === "select" || tag === "textarea") {
    if (el.type) s += ` [type=${el.type}]`;
    if (el.disabled) s += " [disabled]";
    if (el.checked) s += " [checked]";
    if (el.value) s += ` value="${shorten(el.value, 30)}"`;
  }
  return s;
}

// Read the current state (selected, expanded, etc.) of tabs/checkboxes/accordions and the like.
function ariaStates(el) {
  const out = [];
  if (el.getAttribute("aria-selected") === "true") out.push("selected");
  const exp = el.getAttribute("aria-expanded");
  if (exp === "true") out.push("expanded");
  else if (exp === "false") out.push("collapsed");
  if (el.getAttribute("aria-checked") === "true") out.push("checked");
  const cur = el.getAttribute("aria-current");
  if (cur && cur !== "false") out.push("current");
  if (el.getAttribute("aria-disabled") === "true" || el.disabled) out.push("disabled");
  if (el.getAttribute("aria-hidden") === "true") out.push("aria-hidden");
  return out.join(", ");
}

// The element's on-screen position/size/visibility. Useful for diagnosing "it's not showing" issues.
function describePosition(el) {
  const rect = el.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  const cs = getComputedStyle(el);

  if (w === 0 || h === 0 || cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) {
    return `${w}×${h}px · not visible (hidden or zero-size)`;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const inViewport = rect.bottom > 0 && rect.right > 0 && rect.top < vh && rect.left < vw;
  const vert = cy < vh / 3 ? "top" : cy < (vh * 2) / 3 ? "middle" : "bottom";
  const horiz = cx < vw / 3 ? "left" : cx < (vw * 2) / 3 ? "center" : "right";
  const spot = vert === "middle" && horiz === "center" ? "center" : `${vert} ${horiz}`;
  const where = inViewport ? `${spot} of viewport` : "off-screen (scroll to view)";
  return `${w}×${h}px · ${where}`;
}

// The semantic region the element belongs to (nearest landmark) and that region's representative heading.
function describeRegion(el) {
  // Search upward from the parent so the element itself (its role, etc.) is not matched.
  const start = el.parentElement || el;
  const landmark = start.closest(
    "header,nav,main,footer,aside,section,article,form,dialog,[role]"
  );
  if (!landmark || landmark === el) return "";
  let s = landmark.tagName.toLowerCase();
  const lr = landmark.getAttribute("role");
  if (lr) s += `[role=${lr}]`;
  const heading = landmark.querySelector("h1,h2,h3,[aria-label]");
  const ht = heading
    ? shorten(heading.getAttribute("aria-label") || heading.textContent, 30)
    : "";
  return ht ? `inside <${s}> "${ht}"` : `inside <${s}>`;
}

// Detect hashed classes/ids that change on every build.
// e.g. auto-generated identifiers like CSS Modules (foo-module__bar___AbC12),
//     styled-components (sc-abc123), emotion (css-1a2b3c) are not reproducible, so exclude them from selectors.
function isHashy(s) {
  if (/_{2,}[A-Za-z0-9_-]{4,}$/.test(s)) return true; // ...___AiQyW
  if (/-module__/.test(s)) return true;               // webpack CSS Modules
  if (/^sc-[A-Za-z0-9]{5,}$/.test(s)) return true;    // styled-components
  if (/^css-[a-z0-9]{5,}$/i.test(s)) return true;     // emotion
  if (/^[a-z0-9]*[0-9][a-z0-9]*$/i.test(s) && /[A-Z]/.test(s) && /[0-9]/.test(s) && s.length >= 6)
    return true; // random hash mixing upper/lower case and digits
  return false;
}

// Check whether this is a "clean" CSS identifier usable as-is without escaping.
// For Tailwind-style classes (w-1/2, md:flex) containing / : . etc., CSS.escape adds
// backslashes and makes the selector ugly (e.g. .w-1\/2), so exclude such classes from selectors.
function isSimpleIdent(s) {
  return /^-?[A-Za-z_][\w-]*$/.test(s);
}

// Pick up to 2 classes that are stable (not hashed) and clean (no escaping needed).
function stableClasses(node) {
  return Array.from(node.classList)
    .filter((c) => !isHashy(c) && isSimpleIdent(c))
    .slice(0, 2);
}

// Build a selector from stable identifying attributes (test-oriented data-*, name, aria-label, etc.).
const STABLE_ATTRS = ["data-testid", "data-test", "data-cy", "data-qa", "name", "aria-label"];
function stableAttrSelector(node) {
  for (const a of STABLE_ATTRS) {
    const v = node.getAttribute(a);
    if (v && v.length <= 40 && /^[\w\s./:-]+$/.test(v)) return `[${a}="${v}"]`;
  }
  return "";
}

// Build a unique CSS selector that points to the element.
// Priority: stable id → stable attribute → meaningful classes, then :nth-of-type to pin position when needed.
function buildSelector(el) {
  const parts = [];
  let node = el;
  while (node && node.nodeType === Node.ELEMENT_NODE && node !== document.documentElement) {
    if (node.id && !isHashy(node.id) && !/["\\]/.test(node.id)) {
      // Use #id for clean ids; for ids with special characters, use the backslash-free [id="..."] form.
      parts.unshift(isSimpleIdent(node.id) ? `#${node.id}` : `[id="${node.id}"]`);
      break; // A stable id is assumed unique on the page, so end the path here.
    }

    const tag = node.tagName.toLowerCase();
    let part = tag + stableAttrSelector(node);
    if (part === tag) {
      const cls = stableClasses(node);
      if (cls.length) part += "." + cls.join(".");
    }

    // If the selector above also matches siblings within the same parent, add a position index.
    const parent = node.parentElement;
    if (parent) {
      let twins;
      try {
        twins = Array.from(parent.children).filter((c) => c.matches(part));
      } catch (_) {
        twins = [];
      }
      if (twins.length !== 1) {
        const sameTag = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(" > ") || el.tagName.toLowerCase();
}

// A short element description for the toast (e.g. div.card#main).
function describe(el) {
  let s = el.tagName.toLowerCase();
  if (el.id) s += `#${el.id}`;
  if (el.classList.length) s += "." + Array.from(el.classList).slice(0, 2).join(".");
  return s;
}

// ---------------------------------------------------------------------------
// Copy to clipboard (prefer navigator.clipboard, fall back to execCommand on failure).
// ---------------------------------------------------------------------------
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch (_) {
    // If blocked in some contexts, fall back to execCommand.
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  if (!ok) throw new Error("execCommand copy failed");
}

// ---------------------------------------------------------------------------
// Briefly highlight the copied element on screen (so you can visually confirm the right one was picked).
// ---------------------------------------------------------------------------
function highlight(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return; // skip highlighting invisible elements
  const box = document.createElement("div");
  box.style.cssText = [
    "position:fixed",
    `left:${rect.left}px`,
    `top:${rect.top}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    "border:2px solid #16a34a",
    "background:rgba(22,163,74,.12)",
    "border-radius:2px",
    "box-sizing:border-box",
    "z-index:2147483646",
    "pointer-events:none",
    "transition:opacity .3s",
  ].join(";");
  document.documentElement.appendChild(box);
  setTimeout(() => (box.style.opacity = "0"), 650);
  setTimeout(() => box.remove(), 1000);
}

// ---------------------------------------------------------------------------
// Toast notification at the bottom-right of the screen.
// ---------------------------------------------------------------------------
let toastEl = null;
let toastTimer = null;

function showToast(text, success) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:2147483647",
      "max-width:360px",
      "padding:10px 14px",
      "border-radius:8px",
      "font:13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "color:#fff",
      "box-shadow:0 4px 16px rgba(0,0,0,.25)",
      "pointer-events:none",
      "transition:opacity .2s",
    ].join(";");
    document.documentElement.appendChild(toastEl);
  }
  toastEl.style.background = success ? "#16a34a" : "#dc2626";
  toastEl.textContent = text;
  toastEl.style.opacity = "1";

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (toastEl) toastEl.style.opacity = "0";
  }, 2200);
}
