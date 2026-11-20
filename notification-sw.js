// MVP Boss Timer V1.12: focus the game timer when a system notification is clicked.
// Notifications are initiated by the open webpage; no Push subscription is used.
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('notificationclick', event => {
  const url = event.notification.data?.url || self.registration.scope;
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for (const client of windows) {
      if (client.url.startsWith(self.registration.scope) && 'focus' in client) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
