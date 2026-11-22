MVP Boss Timer V1.13 - Local GIF override for stable boss images
==============================================================

Image loading order:
1. ./assets/mobs/<BOSS_ID>.gif (GitHub Pages, your own project)
2. RateMyServer sprite for IDs not on the known-unreliable list
3. Existing two-letter fallback when the images cannot load

For the currently known unreliable external sprites (1115 / Eddga and
1885 / Gopinich), skip step 2 to prevent RMS watermark placeholders.
The correct picture will appear after you upload a valid local GIF.

Example paths in this repository:
  assets/mobs/1115.gif
  assets/mobs/1885.gif

Please make sure you have permission to use and redistribute each GIF.
No third-party sprite image files are included in this update.

Deploy:
  Replace index.html in the root of the GitHub repository.
  Make sure assets/mobs is present in the repository before uploading GIFs.
  Add a properly named GIF into assets/mobs for each desired boss ID.
  Commit changes, refresh the site with Ctrl+Shift+R.

Note: If an external site replaces an animated GIF with a valid watermark
image (HTTP 200), normal image error callbacks cannot detect this reliably.
Add that boss ID to UNRELIABLE_REMOTE_SPRITES in index.html and upload a
local file to prevent the watermark from showing.

Other features, API configuration, respawn timers, and Cloudflare D1 schema
are unchanged. Lord of Death remains +133 minutes; all others +120.
