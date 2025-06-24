// Content script to apply font changes to webpages
(function () {
  let currentFontLink = null;
  let fontStyleElement = null;

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "changeFont") {
      applyFont(request.fontFamily);
      sendResponse({ success: true });
    } else if (request.action === "resetFont") {
      resetFont();
      sendResponse({ success: true });
    }
  });

  // Check for saved font on page load
  chrome.storage.sync.get(["selectedFont"], (result) => {
    if (result.selectedFont) {
      applyFont(result.selectedFont);
    }
  });

  function applyFont(fontFamily) {
    // Remove existing font
    resetFont();

    // Load Google Font
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
      /\s+/g,
      "+"
    )}:wght@300;400;500;600;700&display=swap`;

    currentFontLink = document.createElement("link");
    currentFontLink.rel = "stylesheet";
    currentFontLink.href = fontUrl;
    currentFontLink.id = "font-changer-link";
    document.head.appendChild(currentFontLink);

    // Wait a bit for font to load, then apply styles
    setTimeout(() => {
      createFontStyles(fontFamily);
    }, 200);
  }

  function createFontStyles(fontFamily) {
    fontStyleElement = document.createElement("style");
    fontStyleElement.id = "font-changer-styles";

    // Comprehensive CSS to override most font specifications
    fontStyleElement.textContent = `
        /* Force apply font to all text elements */
        *, *::before, *::after {
          font-family: "${fontFamily}", sans-serif !important;
        }
        
        /* Specific targeting for common elements */
        body, html, div, span, p, h1, h2, h3, h4, h5, h6, 
        a, em, strong, small, mark, del, ins, sub, sup, 
        ul, ol, li, dl, dt, dd, blockquote, pre, code, 
        table, thead, tbody, tfoot, tr, th, td, 
        form, fieldset, legend, label, input, button, select, textarea,
        article, aside, details, figcaption, figure, 
        footer, header, main, nav, section, summary {
          font-family: "${fontFamily}", sans-serif !important;
        }
        
        /* Override font stacks */
        .font-sans, .font-serif, .font-mono {
          font-family: "${fontFamily}", sans-serif !important;
        }
        
        /* Common class overrides */
        [class*="font-"], [class*="text-"], [style*="font-family"] {
          font-family: "${fontFamily}", sans-serif !important;
        }
        
        /* Input elements */
        input, textarea, select, button {
          font-family: "${fontFamily}", sans-serif !important;
        }
        
        /* Code elements - optional, uncomment if you want to change code fonts too */
        /*
        code, pre, samp, kbd, var {
          font-family: "${fontFamily}", monospace !important;
        }
        */
      `;

    document.head.appendChild(fontStyleElement);
  }

  function resetFont() {
    // Remove font link
    if (currentFontLink) {
      currentFontLink.remove();
      currentFontLink = null;
    }

    // Remove font styles
    if (fontStyleElement) {
      fontStyleElement.remove();
      fontStyleElement = null;
    }

    // Also remove any existing font changer elements
    const existingLink = document.getElementById("font-changer-link");
    const existingStyles = document.getElementById("font-changer-styles");

    if (existingLink) existingLink.remove();
    if (existingStyles) existingStyles.remove();
  }

  // Handle page navigation (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      // Reapply font after navigation
      chrome.storage.sync.get(["selectedFont"], (result) => {
        if (result.selectedFont) {
          setTimeout(() => applyFont(result.selectedFont), 500);
        }
      });
    }
  }).observe(document, { subtree: true, childList: true });
})();
