# Receipt Log

Quick receipt entry for business expenses. Installs on your phone and PC, works offline,
and reads receipts for you with a free on-device text reader. Current version: **v2.0.0**
(see `CHANGELOG.md`).

## Put it online with GitHub Pages (one time, ~5 minutes)

1. Sign in at **github.com** (make a free account if you don't have one).
2. Click **+** (top right) → **New repository**. Name it `receipt-log`, choose **Public**
   (Pages is free for public repos; your receipts are NOT uploaded — they stay on your devices),
   and click **Create repository**.
3. On the new repo page click **uploading an existing file**. Unzip `receipt-log-app.zip`
   on your PC and drag **everything inside the folder** (index.html, sw.js, the `icons`,
   `vendor` and `versions` folders, etc.) into the page. Click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment*, set Source to
   **Deploy from a branch**, Branch **main**, folder **/ (root)**, and click **Save**.
5. Wait a minute, refresh the Pages settings screen, and it shows your link:
   `https://YOUR-USERNAME.github.io/receipt-log/`

## Install it

- **iPhone:** open the link in **Safari** → Share button → **Add to Home Screen**.
- **Android:** open the link in **Chrome** → it offers **Install app** (or ⋮ menu → **Install app**).
- **PC:** open the link in **Chrome or Edge** → click the **Install** icon at the right end of
  the address bar (or the app's own **Install app** button).

Open it once while online so the text reader (~11 MB) downloads in the background; after that
everything works with no signal.

## Your data

- Each device keeps its own log. Nothing is sent anywhere.
- Use **Backup & export → Download backup** now and then. Restoring a backup on another
  device merges the receipts in (nothing gets deleted), so you can combine phone + PC logs.
- **Export CSV** gives your accountant a spreadsheet.
- Clearing the browser's site data or uninstalling the app erases that device's receipts —
  that's what the backup is for.

## Updating to a new version

Replace the changed files in the GitHub repo (Add file → Upload files), keep the old build in
`versions/`, add a CHANGELOG entry, and bump `CACHE` in `sw.js`. Installed apps pick up the
update the next time they open online.

## What's in here

| File | What it is |
| --- | --- |
| `index.html` | The app |
| `receipt-parser.js` | Turns receipt text into amount/date/vendor/category |
| `sw.js` | Offline support |
| `manifest.webmanifest`, `icons/` | Install name and icons |
| `vendor/tesseract/` | Free text reader (Tesseract.js 5.1.1, Apache-2.0) |
| `vendor/pdfjs/` | PDF reader (PDF.js 3.11.174, Apache-2.0) |
| `versions/` | Every past build, for rollback |
