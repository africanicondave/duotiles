// src/swRegistration.js
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  // Register on load so it doesn’t compete with initial render
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Optional: listen for updates and reload when a new SW takes control
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              // A new version is available. Reload to get fresh assets.
              console.log('[SW] New content available, reloading…');
              window.location.reload();
            }
          });
        });

        // Optional: listen for controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW] Controller changed');
        });
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
      });
  });
}
