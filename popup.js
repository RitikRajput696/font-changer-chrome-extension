document.addEventListener("DOMContentLoaded", function () {
  const fontSelect = document.getElementById("fontSelect");
  const preview = document.getElementById("preview");
  const applyBtn = document.getElementById("applyFont");
  const resetBtn = document.getElementById("resetFont");
  const status = document.getElementById("status");

  // Load saved font preference
  chrome.storage.sync.get(["selectedFont"], function (result) {
    if (result.selectedFont) {
      fontSelect.value = result.selectedFont;
      updatePreview(result.selectedFont);
      status.textContent = `Current font: ${result.selectedFont}`;
    }
  });

  // Preview font change
  fontSelect.addEventListener("change", function () {
    const selectedFont = this.value;
    if (selectedFont) {
      updatePreview(selectedFont);
      status.textContent = "Click Apply to use this font";
    } else {
      resetPreview();
      status.textContent = "Select a font and click Apply";
    }
  });

  // Apply font to current tab
  applyBtn.addEventListener("click", function () {
    const selectedFont = fontSelect.value;
    if (!selectedFont) {
      status.textContent = "Please select a font first";
      return;
    }

    // Save font preference
    chrome.storage.sync.set({ selectedFont: selectedFont });

    // Get current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Send message to content script
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "changeFont",
          fontFamily: selectedFont,
        },
        function (response) {
          if (chrome.runtime.lastError) {
            status.textContent = "Error applying font";
          } else {
            status.textContent = `Font applied: ${selectedFont}`;
          }
        }
      );
    });
  });

  // Reset font
  resetBtn.addEventListener("click", function () {
    chrome.storage.sync.remove(["selectedFont"]);
    fontSelect.value = "";
    resetPreview();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "resetFont",
        },
        function (response) {
          if (chrome.runtime.lastError) {
            status.textContent = "Error resetting font";
          } else {
            status.textContent = "Font reset to default";
          }
        }
      );
    });
  });

  function updatePreview(fontName) {
    // Load Google Font for preview
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(
      /\s+/g,
      "+"
    )}:wght@300;400;500;600;700&display=swap`;

    // Remove existing font link
    const existingLink = document.getElementById("previewFont");
    if (existingLink) {
      existingLink.remove();
    }

    // Add new font link
    const link = document.createElement("link");
    link.id = "previewFont";
    link.rel = "stylesheet";
    link.href = fontUrl;
    document.head.appendChild(link);

    // Apply font to preview
    preview.style.fontFamily = `"${fontName}", sans-serif`;
    preview.innerHTML = `<p>This is how "<strong>${fontName}</strong>" will look on webpages. The quick brown fox jumps over the lazy dog.</p>`;
  }

  function resetPreview() {
    preview.style.fontFamily = "";
    preview.innerHTML =
      "<p>This is how your selected font will look like. Choose a font from the dropdown above to see the preview.</p>";

    const existingLink = document.getElementById("previewFont");
    if (existingLink) {
      existingLink.remove();
    }
  }
});
