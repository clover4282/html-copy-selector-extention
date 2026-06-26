// Build the right-click menu as submenus under "Copy HTML for AI".
const ROOT_ID = "ai-copy-root";
const MENU_ITEMS = [
  { id: "copy-clean", title: "This element (cleaned up)" },
  { id: "copy-outerhtml", title: "This element (raw outerHTML)" },
  { id: "copy-parent-clean", title: "Parent element (one level up)" },
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: ROOT_ID,
      title: "Copy HTML for AI",
      contexts: ["all"],
    });
    for (const item of MENU_ITEMS) {
      chrome.contextMenus.create({
        id: item.id,
        parentId: ROOT_ID,
        title: item.title,
        contexts: ["all"],
      });
    }
  });
});

// Menu click → forward a message to the content script in the frame where the right-click happened.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || tab.id == null) return;
  chrome.tabs.sendMessage(
    tab.id,
    { type: "COPY_ELEMENT", action: info.menuItemId },
    { frameId: info.frameId ?? 0 },
    () => {
      // Read lastError in the sendMessage callback to suppress the console warning.
      void chrome.runtime.lastError;
    }
  );
});
