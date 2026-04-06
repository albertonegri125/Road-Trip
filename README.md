# 🗺️ Road-Trip v3

Piattaforma per road trip con routing stradale reale, export GPX e community.

## Stack
- React + Vite, Firebase Auth + Firestore
- Leaflet / OpenStreetMap (mappa gratuita)
- OpenRouteService (routing reale gratuito)
- Globe.gl (globo 3D landing)
- @dnd-kit (drag & drop tappe)
- Netlify (deploy)

## Setup

```bash
npm install
cp .env.example .env.local
# Compila .env.local con le credenziali Firebase e ORS
npm run dev
```

## Variabili d'ambiente richieste (.env.local)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ORS_API_KEY=          ← da openrouteservice.org (gratuito)
```

## Deploy Netlify
1. Push su GitHub
2. Netlify → Import from Git → seleziona repo
3. Build: `npm ci && npm run build` / Publish: `dist`
4. Aggiungi le variabili d'ambiente su Netlify
