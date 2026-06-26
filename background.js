// A single right-click menu item that starts pick mode (same as the toolbar icon / shortcut).
const ROOT_ID = "ai-copy-root";

// Look up the keyboard shortcut the user actually has assigned to pick mode (may differ from the
// suggested default, or be empty if they cleared it). Passed to the content script and the tooltip
// so the shortcut is always shown accurately.
function getPickShortcut(cb) {
  chrome.commands.getAll((cmds) => {
    const cmd = (cmds || []).find((c) => c.name === "toggle-pick-mode");
    cb(cmd && cmd.shortcut ? cmd.shortcut : "");
  });
}

// Show the current shortcut in the toolbar icon's tooltip so users can discover it on hover.
function refreshActionTitle() {
  getPickShortcut((shortcut) => {
    const suffix = shortcut ? ` (${shortcut})` : "";
    chrome.action.setTitle({ title: `Pick an element to copy for AI${suffix}` });
  });
}

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: ROOT_ID,
      title: "Copy HTML for AI",
      contexts: ["all"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
  refreshActionTitle();
});
chrome.runtime.onStartup.addListener(refreshActionTitle);

// Enter pick mode in the given tab, passing along the current shortcut so the toast can show it.
function startPickMode(tabId) {
  getPickShortcut((shortcut) => {
    chrome.tabs.sendMessage(tabId, { type: "ENTER_PICK_MODE", shortcut }, () => {
      // Read lastError in the callback to suppress the console warning (e.g. on chrome:// pages).
      void chrome.runtime.lastError;
    });
  });
}

// Toolbar icon click → enter element-pick mode (like devtools "inspect").
chrome.action.onClicked.addListener((tab) => {
  if (!tab || tab.id == null) return;
  startPickMode(tab.id);
});

// Keyboard shortcut → same as clicking the toolbar icon: toggle element-pick mode.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "toggle-pick-mode") return;
  // `tab` is provided on recent Chrome; fall back to querying the active tab otherwise.
  if (tab && tab.id != null) {
    startPickMode(tab.id);
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id != null) startPickMode(tabs[0].id);
    });
  }
});

// Right-click menu → start pick mode, just like the toolbar icon / shortcut.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== ROOT_ID) return;
  if (!tab || tab.id == null) return;
  startPickMode(tab.id);
});
