# Receipt Log — Changelog

Every past build is kept in `versions/`. To roll back, copy an older file over
`index.html` (and `receipt-parser.js` if one is listed), upload, and bump `CACHE`
in `sw.js` so phones pick it up. Receipts stored on your devices are not affected.

## v2.2.1 — 2026-10-17 — Name-free reports
- PDF report header uses the signal symbol (`brand/symbol.svg`: white pulse on a green tile)
  instead of the "Austin Bergquist" logo; the page footer reads "Receipt Log vX · period".
- Added `brand/symbol-mono.svg` (one-color outline version).
- Files: `versions/receipt-log-v2.2.1.html`

## v2.2.0 — 2026-10-17 — Exports
- Every receipt gets a number (R-0001, R-0002…), shown in the list and the edit screen. Existing
  receipts are numbered automatically in date order.
- New **Export** panel: date range (this/last month, quarter, year, all, or custom dates) and
  filters for category, payment method, and "only receipts with images", with a live count and total.
- **PDF report**: logo header, period and filters, totals, by-category summary, receipt table with
  links to each receipt's image page, then one page per receipt photo or PDF.
- **CSV + images (ZIP)**: `receipts.csv` plus `images/` named `R-0007_2026-10-14_Vendor_51.21.jpg`;
  the CSV's Image file column matches each file name.
- **CSV only**: now includes Receipt # and Image file columns and a total row.
- On phones, exports open the share sheet (Files, Drive, email); on PC they download.
- Backup & restore moved to its own panel. jsPDF 2.5.1 and JSZip 3.10.1 bundled in `vendor/`.
- Files: `versions/receipt-log-v2.2.0.html`

## v2.1.0 — 2026-10-17 — Branding
- Austin Bergquist logo (direction D, "signal wordmark") in the footer; switches to the white
  version in dark mode.
- New home-screen / install icons: "AB" over the green pulse.
- Logo files (outlined vector, no font needed) in `brand/`.
- Files: `versions/receipt-log-v2.1.0.html`

## v2.0.2 — 2026-10-17 — iPhone save fix
- Fixed "Couldn't save: InvalidStateError … database connection is closing" on iPhone. iOS Safari
  can close the on-device database (often after the camera/photo picker); the app now reopens it
  and retries automatically.
- Images are stored as raw bytes instead of Blobs, which some iOS versions refuse to store.
  Older saved images still load.
- Files: `versions/receipt-log-v2.0.2.html`

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
