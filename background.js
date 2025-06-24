// Background service worker for the font changer extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Font Changer extension installed");
  } else if (details.reason === "update") {
    console.log("Font Changer extension updated");
  }
});

// Listen for tab updates to reapply fonts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only act when the page has finished loading
  if (changeInfo.status === "complete" && tab.url) {
    // Skip chrome:// and extension pages
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      return;
    }

    // Get saved font and apply it to the new page
    chrome.storage.sync.get(["selectedFont"], (result) => {
      if (result.selectedFont) {
        // Small delay to ensure content script is ready
        setTimeout(() => {
          chrome.tabs
            .sendMessage(tabId, {
              action: "changeFont",
              fontFamily: result.selectedFont,
            })
            .catch(() => {
              // Ignore errors (tab might not have content script loaded yet)
            });
        }, 100);
      }
    });
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getFontPreference") {
    chrome.storage.sync.get(["selectedFont"], (result) => {
      sendResponse({ selectedFont: result.selectedFont });
    });
    return true; // Will respond asynchronously
  }
});

// Context menu for quick access (optional)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "resetFont",
    title: "Reset Font to Default",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "resetFont") {
    chrome.tabs
      .sendMessage(tab.id, {
        action: "resetFont",
      })
      .catch(() => {
        // Ignore errors
      });
  }
});
