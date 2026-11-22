MVP Boss Timer V1.14 - Image and Layout Reliability Fix

What changed:
1) Missing external GIFs no longer remove <img> from the 5-column grid.
   This prevents the spawn clock and edit/delete controls from overlapping.
2) The gallery shows an explicit missing-image placeholder (still clickable),
   instead of pretending a RateMyServer placeholder is a real monster sprite.
3) Known unreliable remote GIFs: Eddga ID 1115; Gopinich ID 1885.
   To display the real animated monster, add an authorized local GIF at:
   assets/mobs/1115.gif and assets/mobs/1885.gif.
   For all other IDs, the site falls back from local asset to RMS URL.
4) A poll that contains unchanged boss records no longer recreates the entire
   table every 15 seconds. This reduces network retries and picture flicker.
5) Preserves Lord of Death ID 1373: 133-minute respawn. All others: 120 minutes.
6) No Cloudflare Worker, D1, config.js or notification-sw.js changes required.

INSTALL:
Upload the new index.html to the root of your GitHub Pages repository.
Retain the rest of your files and any existing assets/mobs/GIFs.

LIMITATION:
Hotlinked RateMyServer images may be swapped for a valid placeholder response.
No browser-side onerror handler can reliably detect every such response.
Permanent correct GIF display requires local files for the boss IDs concerned
and permission to redistribute those artwork files.
