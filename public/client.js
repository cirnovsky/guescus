
(function() {
  // Try to find the script tag that loaded this code
  let script = document.currentScript;
  
  // Fallback: If currentScript is null (can happen in some async contexts), try to find by specific ID if user provided one,
  // or find the last script tag with the correct src format.
  if (!script) {
    const scripts = document.querySelectorAll('script[src*="/client.js"]');
    if (scripts.length > 0) {
      script = scripts[scripts.length - 1];
    }
  }

  if (!script) {
    console.error("Guescus: Could not identify the script tag. Please ensure the script is loaded correctly.");
    return;
  }

  const attributes = script.dataset;
  const params = new URLSearchParams();

  // Map data-attributes to query parameters
  Object.entries(attributes).forEach(([key, value]) => {
    params.set(key, value);
  });

  // Calculate the origin (where this React app is hosted)
  let origin;
  try {
      const srcUrl = new URL(script.src);
      origin = srcUrl.origin;
  } catch (e) {
      console.error("Guescus: Invalid script source URL.");
      return;
  }

  // Create the Iframe
  const iframe = document.createElement('iframe');
  const iframeUrl = `${origin}/?${params.toString()}`;

  iframe.src = iframeUrl;
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.minHeight = '150px'; // Prevent collapse while loading
  iframe.title = 'Comments';
  iframe.setAttribute('scrolling', 'no'); // Prefer resize over scroll
  
  // Resizing logic: Listen for messages from the React App to resize height
  window.addEventListener('message', (event) => {
    if (event.origin !== origin) return;
    if (event.data.type === 'resize' && event.data.height) {
      iframe.style.height = `${event.data.height}px`;
    }
  });

  // Inject
  script.insertAdjacentElement('afterend', iframe);
})();
