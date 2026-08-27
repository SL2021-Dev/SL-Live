// push-sw.js
// Service worker for push-subscribe.html / push-server.py

// Where push-server.py is reachable. Keep in sync with push-subscribe.html.

const SERVER_URL = 'http://localhost:5000';

function reportAck(data, status) {
  return fetch(SERVER_URL + '/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: data.device_id,
      notification_id: data.notification_id,
      status: status
    })
  });
}

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { message: event.data ? event.data.text() : 'SmartLOG Alert' };
  }

  event.waitUntil(
    self.registration.showNotification('SmartLOG', {
      body: payload.message || 'SmartLOG Alert',
      requireInteraction: true,
      data: {
        device_id: payload.device_id,
        notification_id: payload.notification_id
      },
      actions: [{ action: 'ack', title: 'Acknowledge' }]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'ack') {
    event.waitUntil(reportAck(event.notification.data || {}, 'acknowledged'));
  }
});

self.addEventListener('notificationclose', event => {
  event.waitUntil(reportAck(event.notification.data || {}, 'dismissed'));
});
