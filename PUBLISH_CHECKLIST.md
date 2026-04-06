# CFCoach Chrome Web Store Publish Checklist

## Already Prepared in Repo
- Manifest version bumped to `0.1.1`.
- Host permissions narrowed to Codeforces + backend only.
- Icons configured in manifest (`16/32/48/128`).
- Privacy policy draft added in `PRIVACY_POLICY.md`.

## 1) Final Local Validation
1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Reload for CFCoach.
4. Test on a Codeforces profile:
   - Profile Analysis works.
   - Daily Mix works.
   - Contest Generator works.
   - Contest `Reveal Ratings` works.

## 2) Fill Missing Privacy Info
1. Open `PRIVACY_POLICY.md`.
2. Replace the contact placeholder with your email.
3. Publish this privacy policy to a public URL (GitHub Pages, your website, Notion public page, etc.).

## 3) Create Upload ZIP
From project root, create zip with extension files at root level (no parent folder nesting).

Suggested PowerShell command:

```powershell
Compress-Archive -Path manifest.json,contentScript.css,contentScript.js,overlay.config.js,overlay.css,overlay.html,overlay.js,icons -DestinationPath CFCoach-extension-v0.1.1.zip -Force
```

## 4) Chrome Web Store Submission
1. Open Chrome Web Store Developer Dashboard.
2. Create New Item.
3. Upload `CFCoach-extension-v0.1.1.zip`.
4. Fill listing fields:
   - Name/summary/description
   - Screenshots
   - Category
   - Privacy policy URL
5. Submit for review.

## 5) Future Updates
For every update:
1. Bump `version` in `manifest.json`.
2. Recreate zip with new version name.
3. Upload new package in dashboard.
