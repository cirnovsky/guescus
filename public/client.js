
(function() {
  const script = document.currentScript;
  const attributes = script.dataset;
  const params = new URLSearchParams();

  // Map data-attributes to query parameters
  Object.entries(attributes).forEach(([key, value]) => {
    params.set(key, value);
  });

  // Calculate the origin (where this React app is hosted)
  // If the script is loaded from https://my-app.vercel.app/client.js, the origin is https://my-app.vercel.app
  const srcUrl = new URL(script.src);
  const origin = srcUrl.origin;

  // Create the Iframe
  const iframe = document.createElement('iframe');
  const iframeUrl = `${origin}/?${params.toString()}`;

  iframe.src = iframeUrl;
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.minHeight = '150px'; // Prevent collapse while loading
  iframe.title = 'Comments';
  
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
