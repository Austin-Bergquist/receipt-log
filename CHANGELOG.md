# Receipt Log — Changelog

Every past build is kept in `versions/`. To roll back, copy an older file over
`index.html` (and `receipt-parser.js` if one is listed), upload, and bump `CACHE`
in `sw.js` so phones pick it up. Receipts stored on your devices are not affected.

## v2.0.1 — 2026-10-17 — iPhone fix
- Receipt reader used a regex lookbehind, which iOS Safari before 16.4 can't parse; that stopped the
  whole app on older iPhones. Rewritten without it (same results).
- Startup errors now show in red under the title instead of leaving a dead page.
- Files: `versions/receipt-log-v2.0.1.html`, `versions/receipt-parser-v2.0.1.js`

## v2.0.0 — 2026-10-16 — Standalone app
- Moved out of Claude into an installable web app (phone home screen + PC install).
- Works fully offline. Receipts and images saved on each device (IndexedDB).
- Take photo / choose image or PDF; tap the thumbnail to view it.
- Free on-device auto-detect (Tesseract OCR, bundled in `vendor/`): fills amount,
  date, vendor, category, and cash/check payment. Text-based PDFs are read directly.
- Learns from your log: a vendor you've used before gets your spelling and its last category.
- Backup file download + restore (merges, never deletes), CSV export.
- Files: `versions/receipt-log-v2.0.0.html`, `versions/receipt-parser-v2.0.0.js`

## v1.2.0 — 2026-10-16 — Claude artifact
- Claude-powered auto-detect from photo or PDF. File: `versions/receipt-log-v1.2.0-claude-artifact.html`

## v1.1.0 — 2026-10-16 — Claude artifact
- Separate "Take photo" and "Choose file" buttons; PDF receipts.

## v1.0.0 — 2026-10-16 — Claude artifact
- First build: quick entry, category chips, monthly/YTD totals, search, edit/delete, CSV.
