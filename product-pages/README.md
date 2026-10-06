# Product pages

Standalone product pages, one folder each. They're separate from the Shopify theme in the repo root.

Each page builds into a single self-contained `index.html` (scripts and images inlined, fonts from Google Fonts), so it opens straight from disk or any static host.

```
npm install
node build.mjs ocean-drive-neon   # writes ocean-drive-neon/index.html
```

Edit `<page>/src/index.html` (markup and styles) and `<page>/src/app.js` (3D and interactions), then rebuild. Photos live in `<page>/img/` and are referenced as `{{img:file.webp}}`.

Add `?still` to the URL to turn off the camera easing, the flicker and the passing headlights. That's useful for screenshots.

| Page | Product |
|---|---|
| `ocean-drive-neon/` | 300 mm LED neon sign (R + star over a night beach print). See its `RESEARCH.md`. |
