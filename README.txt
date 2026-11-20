MVP Boss Timer V1.11 - Notification Bell Menu

Upload/replace the following files in your existing GitHub repository:
  index.html
  notification-sw.js
  manifest.webmanifest
  assets/mvp-app-192.png
  assets/mvp-app-512.png

Keep the existing config.js, Cloudflare Worker and D1 database unchanged.

Bell usage:
1. Click the bell to open the settings menu (default OFF on EVERY new page load).
2. Click "เปิดแจ้งเตือน"; if Chrome/Edge prompts for Notifications, choose Allow.
3. The "ลองแจ้งเตือนก่อน" test button now appears INSIDE the same bell menu.
4. Click the test button any time to test. No test is sent automatically on enabling.
5. Click "ปิดแจ้งเตือน" to disable. Refreshing the tab automatically disables it again.

Note: browser-level Allow permission remains unchanged after refreshing; only the
site's own timer alert setting resets to OFF. The site must remain open.
The browser/OS may show the site origin along with the notification heading,
which the webpage cannot hide.

Test after deployment: https://wchanon0909.github.io/MVP-Boss-Timer/?v=1.11
Hard refresh if old files are cached (Ctrl+Shift+R).
The website's frontend was updated only; no Cloudflare/D1 changes are needed.
