# Straits Aquatics Auctions — Ocean Theme v2

This is the public Straits Aquatics auction site with the deep-blue underwater theme.

## Upload to GitHub

Replace the files in the public repository:

`StraitsAquatics/straits-aquatics-auctions`

with the files in this package.

Keep `auction.js` unchanged — this package preserves the working Supabase Auth, bidding, Buy It Now, winner and delivery logic.

## Add your real logo

Upload your transparent Straits Aquatics logo PNG to the repository root with the exact filename:

`straits-logo.png`

The header is already coded to load that image. Until the logo file exists, the site displays a temporary text/fish fallback rather than a broken image.

Recommended logo file:
- Transparent PNG
- Full Straits Aquatics logo/wordmark if available
- Roughly 700–1200 px wide for a crisp desktop header

## New visual asset

`ocean-bg.svg` is the coded underwater background. It contains no baked-in website text or buttons, so the real HTML remains responsive and interactive.

## Deployment

Commit the replacement files to `main`. GitHub Pages will redeploy automatically.
