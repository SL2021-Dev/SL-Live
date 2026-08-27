// push-sw.js
// Service worker for push-subscribe.html / push-server.py

self.addEventListener('push', event => {
  const data = event.data ? event.data.text() : 'SmartLOG Alert';
  event.waitUntil(
    self.registration.showNotification('SmartLOG', {
      body: data
    })
  );
});
