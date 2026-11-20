// MVP Boss Timer V1.6 — notification helper only; no offline cache or Push server.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await clients.matchAll({type:'window',includeUncontrolled:true});
    for (const windowClient of windows) {
      if (windowClient.url.startsWith(self.registration.scope) && 'focus' in windowClient) {
        return windowClient.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(self.registration.scope);
  })());
});
