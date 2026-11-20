MVP Boss Timer V1.9 — GIF gallery fix

Update only the index.html file in the root of your existing GitHub repository.

Changed:
- The MVP popup now shows real animated GIF sprites from RateMyServer (the same source used in module 02).
- Increased sprite display area without cropping images; 3 columns on desktop, 2 on mobile.
- Fixed the missing image-load handler in V1.8 that made loaded GIFs invisible and left initials in place.
- Initials appear only while a GIF is loading or when a third-party image cannot be reached.
- Boss names and Size / Race / Element remain underneath each GIF.

No changes to Cloudflare Worker, D1, config.js or notification-sw.js.
Keep the existing boss list, 2-hour respawn, notification and Light/Dark settings.
If RateMyServer image URLs are inaccessible on a client's network, a text fallback will appear for that image.
