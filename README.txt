MVP Boss Timer V1.12 — Desktop Update

Changes:
1. Gallery: Bosses with active entries in module 02/03 are gray but remain clickable.
   Records older than 5 hours after spawn are not considered active.
2. Footer: MVP Boss Timer · v1.12 · Powered by $a$ha_
3. Notification robustness for Chrome and Edge: retries a minimal local-icon notification if a remote GIF fails.
   When a tab is throttled in the background, alerts for spawns after opt-in can fire when the tab resumes (within 5 hours).
   Default OFF every page load. Users must open the bell menu, enable notifications, and click the optional test button.
   Edge and Windows notification permissions must also allow it.
4. Desktop interface preserved. No mobile UI redesign in this update.

GitHub update:
Upload index.html and notification-sw.js to the repository ROOT (overwrite old files).
Leave config.js, Cloudflare Worker, D1, manifest.webmanifest and assets as they are.

Only browser tests via Chromium are available here; OS notifications on a real Edge installation must be tested by your friend.
