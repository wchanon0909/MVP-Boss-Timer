MVP Boss Timer V1.8 — GitHub Pages update

Changes:
- Fixed columns for Size / Race / Element (text only; element grade/color removed).
- The i icon next to each boss opens RateMyServer Pre-Renewal mob database page.
- MVP button next to Boss dropdown opens a compact clickable boss-image gallery.
- Keeps V1.7 Light/Dark, live shared D1/Worker, notifications, 5-minute ready and 5-hour hide rules.

Deploy to existing repository:
1. Upload index.html to repository ROOT and replace existing index.html.
2. Commit to main; reload GitHub Pages. Keep existing config.js (Worker URL) and notification-sw.js.
3. Worker and D1 require no changes.

Boss artwork is retrieved from RateMyServer on page load. If an image is unavailable the gallery shows a placeholder.
The Private Server boss/map list and +2h respawn rule remain unchanged.
