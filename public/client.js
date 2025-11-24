
(function() {
  // Try to find the script tag that loaded this code
  let script = document.currentScript;
  
  // Fallback: If currentScript is null
  if (!script) {
    const scripts = document.querySelectorAll('script[src*="/client.js"]');
    if (scripts.length > 0) {
      script = scripts[scripts.length - 1];
    }
  }

  if (!script) {
    console.error("Guescus: Could not identify the script tag.");
    return;
  }

  const attributes = script.dataset;
  const params = new URLSearchParams();

  // 1. Calculate the 'Term' based on the mapping strategy
  const mapping = attributes.mapping || 'pathname';
  let term = attributes.term;

  switch (mapping) {
    case 'pathname':
      term = location.pathname.length < 2 ? 'index' : location.pathname.substr(1).replace(/\.\w+$/, '');
      break;
    case 'url':
      term = location.href;
      break;
    case 'title':
      term = document.title;
      break;
    case 'og:title':
      const meta = document.querySelector('meta[property="og:title"]');
      term = meta ? meta.content : document.title;
      break;
    case 'specific':
      // term is already set from data-term
      break;
    case 'number':
      // Term is treated as a number in the app logic, passed as-is
      break;
    default:
      term = location.pathname;
      break;
  }

  // 2. Set all parameters
  params.set('term', term);
  params.set('pageUrl', location.href); // Important for linking back in the discussion body
  
  // Copy other data attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key !== 'mapping' && key !== 'term') { // Term is handled above
        params.set(key, value);
    }
  });

  // 3. Determine Origin
  let origin;
  try {
      const srcUrl = new URL(script.src);
      origin = srcUrl.origin;
  } catch (e) {
      console.error("Guescus: Invalid script source URL.");
      return;
  }

  // 4. Create Iframe
  const iframe = document.createElement('iframe');
  const iframeUrl = `${origin}/?${params.toString()}`;

  iframe.src = iframeUrl;
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.minHeight = '150px';
  iframe.title = 'Comments';
  iframe.setAttribute('scrolling', 'no');
  
  // 5. Handle Resizing & Theme Messages
  window.addEventListener('message', (event) => {
    if (event.origin !== origin) return;
    
    // Resize
    if (event.data.type === 'resize' && event.data.height) {
      iframe.style.height = `${event.data.height}px`;
    }
  });

  // Handle checking if parent is in head (move to body)
  if (document.head.contains(script)) {
     document.addEventListener("DOMContentLoaded", () => {
         document.body.appendChild(iframe);
     });
  } else {
     script.insertAdjacentElement('afterend', iframe);
  }
})();
