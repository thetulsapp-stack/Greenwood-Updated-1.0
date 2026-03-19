# Greenwood update + deployment steps

## 1) Replace your local project with this package
- Unzip this download.
- Open the `Greenwoodlo` folder in VS Code or your editor.

## 2) Create a local env file
Create `.env.local` in the project root and paste your real values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_GOOGLE_GEOCODING_KEY=YOUR_GOOGLE_BROWSER_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_BROWSER_KEY
NEXT_PUBLIC_ADMIN_EMAILS=your_admin_email@example.com
```

## 3) Install and test locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## 4) Update the GitHub repository
From the project folder:
```bash
git add .
git commit -m "Harden Firebase config and fix Vercel build"
git push origin main
```

## 5) Add Vercel environment variables
In Vercel:
- Project
- Settings
- Environment Variables

Add every variable from `.env.local`.

After saving, redeploy.

## 6) Redeploy
Either:
- push to GitHub and let Vercel redeploy automatically, or
- open Vercel > Deployments > latest deployment > Redeploy

## 7) If the old build cache causes issues
In Vercel redeploy options, choose to redeploy without cache.

## 8) Post-launch security cleanup
Because keys were exposed in chat earlier, rotate both:
- Firebase web API key
- Google Maps browser key

Then update `.env.local` and Vercel with the new values.
