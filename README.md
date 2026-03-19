# Greenwood

Greenwood is a local business directory built with Next.js, Firebase, and Google Maps.

## What was fixed in this update
- Firebase now fails safely when env vars are missing instead of crashing Vercel prerendering.
- Client pages now guard against missing Firebase services.
- Auth, Firestore, and Storage access use safe helper functions.
- The directory, map, submit, owner, admin, and visual page flows were updated to avoid null-service runtime errors.
- Environment variable templates and deployment docs were cleaned up.

## Local setup
1. Copy `.env.example` to `.env.local`
2. Fill in your real values
3. Run:
   ```bash
   npm install
   npm run dev
   ```

## Deployment
See `DEPLOYMENT-STEPS.md`.
