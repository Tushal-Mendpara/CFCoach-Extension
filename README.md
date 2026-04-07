# CFCoach Chrome Extension

CFCoach is a Chrome extension for Codeforces users that helps you practice smarter with profile-based recommendations and generated practice sets.

It adds a `CFCOACH` tab directly on Codeforces profile pages and opens an in-page panel with:

- Profile Analysis
- Daily Mix
- Contest Generator

## Install From Chrome Web Store

Use the public listing:

https://chromewebstore.google.com/detail/ackkplclopoecipnfllalmencpbnonoo?utm_source=item-share-cb

Click **Add to Chrome** and confirm installation.

## How To Use

1. Open any Codeforces profile page (for example: `https://codeforces.com/profile/tourist`).
2. Click the **CFCOACH** tab injected on the page.
3. Use the panel features:
   - **Profile Analysis**: View strengths, weak areas, and performance patterns.
   - **Daily Mix**: Get a ready-to-practice problem set for daily consistency.
   - **Contest Generator**: Build balanced mashup-style sets for solo or group practice.

## Privacy

Privacy policy:

https://tushal-mendpara.github.io/CFCoach-Extension/privacy-policy.html

## Local Development (Optional)

If you want to run or test this repository locally:

1. Clone/download this repo.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this project folder.

### Backend API Base URL

To change the backend endpoint for local testing, edit `overlay.config.js`:

`window.CFCOACH_CONFIG.API_BASE = "https://your-backend-domain.com"`
