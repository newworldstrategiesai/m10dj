/**
 * Service Worker registration and management
 * Enables offline functionality for the karaoke app
 */

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker for offline functionality
 */
export async function registerServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return false;
  }

  try {
    console.log('Registering Service Worker...');

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    serviceWorkerRegistration = registration;

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            showUpdateNotification();
          }
        });
      }
    });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker updated, reloading page...');
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    console.log('Service Worker registered successfully');
    return true;

  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!serviceWorkerRegistration) return true;

  try {
    const result = await serviceWorkerRegistration.unregister();
    serviceWorkerRegistration = null;
    console.log('Service Worker unregistered');
    return result;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if service worker is registered and active
 */
export function isServiceWorkerActive(): boolean {
  return !!(serviceWorkerRegistration && serviceWorkerRegistration.active);
}

/**
 * Send message to service worker
 */
export function sendMessageToSW(message: any): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Handle messages from service worker
 */
function handleServiceWorkerMessage(event: MessageEvent): void {
  const { type, data } = event.data;

  switch (type) {
    case 'SYNC_OFFLINE_DATA':
      // Trigger offline queue processing
      if (typeof window !== 'undefined' && (window as any).processOfflineQueue) {
        (window as any).processOfflineQueue();
      }
      break;

    case 'CACHE_UPDATED':
      console.log('Cache updated:', data);
      break;

    default:
      console.log('Unknown SW message:', type, data);
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification(): void {
  // Create a toast or modal to notify user of update
  const updateToast = document.createElement('div');
  updateToast.id = 'sw-update-toast';
  updateToast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #06b6d4;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
    ">
      <div style="font-weight: 600; margin-bottom: 0.5rem;">🎤 Update Available</div>
      <div style="font-size: 0.9rem; margin-bottom: 1rem; opacity: 0.9;">
        A new version of the karaoke app is available.
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button onclick="window.location.reload()" style="
          background: white;
          color: #06b6d4;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          font-weight: 600;
          cursor: pointer;
        ">Update Now</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
        ">Later</button>
      </div>
    </div>
  `;

  document.body.appendChild(updateToast);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    const toast = document.getElementById('sw-update-toast');
    if (toast) toast.remove();
  }, 10000);
}

/**
 * Request background sync for offline data
 */
export function requestBackgroundSync(): void {
  if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration?.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      (registration as any).sync.register('karaoke-offline-sync');
    });
  }
}

/**
 * Check if app is running offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onOnlineStatusChange(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  const handleOnline = () => {
    console.log('App is back online');
    onOnline();

    // Trigger background sync
    requestBackgroundSync();
  };

  const handleOffline = () => {
    console.log('App went offline');
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Hook for service worker status
 */
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initSW = async () => {
      const registered = await registerServiceWorker();
      setIsRegistered(registered);
      setIsActive(isServiceWorkerActive());

      // Listen for updates
      if (registered) {
        cleanup = onOnlineStatusChange(
          () => setIsActive(true),
          () => setIsActive(false)
        );
      }
    };

    initSW();

    return () => cleanup?.();
  }, []);

  return {
    isRegistered,
    isActive,
    updateAvailable,
    unregister: unregisterServiceWorker,
    sendMessage: sendMessageToSW
  };
}

// React import for hook
import React from 'react';