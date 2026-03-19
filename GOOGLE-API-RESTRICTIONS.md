# Google API restriction setup

## Firebase web API key
Application restriction:
- Websites (HTTP referrers)

Allowed websites:
- http://localhost:3000/*
- https://localgreenwood.com/*
- https://www.localgreenwood.com/*
- https://*.vercel.app/*

API restrictions:
- Identity Toolkit API
- Token Service API
- Firebase Installations API

## Google browser key for Maps / Geocoding
Application restriction:
- Websites (HTTP referrers)

Allowed websites:
- http://localhost:3000/*
- https://localgreenwood.com/*
- https://www.localgreenwood.com/*
- https://*.vercel.app/*

API restrictions:
- Geocoding API
- Maps JavaScript API

Only add Places API later if you actually use autocomplete.

## Important
Do not leave browser keys unrestricted in production.
Allow all visitors on your approved domains, not all domains on the internet.
