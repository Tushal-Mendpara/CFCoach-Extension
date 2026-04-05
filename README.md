# CFCoach Chrome Extension (Standalone)

This is a separate extension project and does not modify your existing CFCoach web app.

## Features

- Injects a CFCoach tab on Codeforces profile pages.
- Opens an in-page panel with tabs:
  - Profile Analysis
  - Daily Mix
  - Contest Generator
- Uses your backend APIs through a configurable base URL.

## Change Deploy Link (Single Place)

Update only this file before publishing:

- `overlay.config.js`

Set:

- `window.CFCOACH_CONFIG.API_BASE = "https://your-backend-domain.com"`

No other extension files need URL changes.

## Load In Chrome (Developer Mode)

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `CFCoach` folder.
5. Open a Codeforces profile page and click the `CFCOACH` tab.

## Notes

- Handle is stored in `chrome.storage.local`.
- This is an MVP scaffold you can iterate on for production release.
