// sw.js

self.addEventListener('push', event => {
  const data = event.data ? event.data.text() : 'SmartLOG Alert';
  event.waitUntil(
    self.registration.showNotification('SmartLOG', {
      body: data
    })
  );
});









