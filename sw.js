// sw.js - Service Worker
self.addEventListener('install', (evt) => {
  // skipWaiting if you want immediate activation on install
  // self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  // clients.claim() if you want SW to control pages immediately after activation
  // evt.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }

  const serial = payload.serial || 'unknown';
  const title = payload.title || 'SmartLOG Live';
  const body = payload.message ? `${payload.message} (SN: ${serial})` : `New SmartLOG message (SN: ${serial})`;
  const options = {
    body,
    icon: payload.icon || '/images/smartlog-icon.png',
    data: { serial, url: payload.url || '/settings' },
    actions: [
      { action: 'open', title: payload.actionOpenTitle || 'Open Dashboard' },
      { action: 'ack', title: payload.actionAckTitle || 'Acknowledge' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { serial, url } = event.notification.data || {};
  const openUrl = `${url}?serial=${encodeURIComponent(serial || '')}`;

  if (event.action === 'ack') {
    // Send ack to backend (fire-and-forget)
    event.waitUntil(fetch('/api/acknowledge', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ serial })
    }).catch(()=>{}));
    // Optionally open dashboard
    event.waitUntil(clients.openWindow(openUrl));
    return;
  }

  // Default click or 'open'
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(clientList => {
      const client = clientList.find(c => c.url.includes('/settings'));
      return client ? client.focus() : clients.openWindow(openUrl);
    }));
});
