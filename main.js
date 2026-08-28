// main.js
// Configurable strings
const POPUP_TITLE = 'SmartLOG Live';
const POPUP_BODY_TEMPLATE = 'If you want to accept push notifications for serial {serial}, click Enable. You can change this later in your dashboard.';
const ENABLE_BUTTON_TEXT = 'Enable Push Notifications';
const CANCEL_BUTTON_TEXT = 'Cancel';

// Replace with your VAPID public key (base64 url-safe)
const VAPID_PUBLIC = '<YOUR_VAPID_PUBLIC_KEY>';

// -- Helpers --
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function setModalTexts(serial) {
  document.getElementById('modal-title').textContent = POPUP_TITLE;
  document.getElementById('modal-body').textContent = POPUP_BODY_TEMPLATE.replace('{serial}', serial);
  document.getElementById('modal-enable').textContent = ENABLE_BUTTON_TEXT;
  document.getElementById('modal-cancel').textContent = CANCEL_BUTTON_TEXT;
}

function showModal() {
  const m = document.getElementById('confirm-modal');
  m.style.display = 'flex';
  m.setAttribute('aria-hidden', 'false');
}

function hideModal() {
  const m = document.getElementById('confirm-modal');
  m.style.display = 'none';
  m.setAttribute('aria-hidden', 'true');
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) throw new Error('Service Workers not supported');
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return reg;
}

async function subscribeForPush(reg, vapidPublicKey) {
  if (!('PushManager' in window)) throw new Error('Push not supported');
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });
}

// Form handler
document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const serial = document.getElementById('serial').value.trim() || 'unknown';
  const wantPush = document.getElementById('push').checked;
  const wantSms = document.getElementById('sms').checked;
  const wantEmail = document.getElementById('email').checked;

  // Save preferences to your backend (replace endpoint as needed)
  try {
    await fetch('/api/save-preferences', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ serial, push: wantPush, sms: wantSms, email: wantEmail })
    });
  } catch (err) {
    console.warn('Preferences save failed (offline?)', err);
  }

  if (wantPush) {
    setModalTexts(serial);
    showModal();
  } else {
    alert('Preferences saved.');
  }
});

// Modal controls
document.getElementById('modal-cancel').addEventListener('click', hideModal);
document.getElementById('modal-enable').addEventListener('click', async () => {
  hideModal();
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Notification permission denied');
      return;
    }

    const reg = await registerServiceWorker();
    const sub = await subscribeForPush(reg, VAPID_PUBLIC);

    // Send subscription to backend to associate with the user/serial
    await fetch('/api/save-subscription', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ subscription: sub })
    });

    alert('Push enabled — you should receive a test notification shortly.');
  } catch (err) {
    console.error('Enable push failed', err);
    alert('Could not enable push: ' + (err && err.message ? err.message : err));
  }
});
