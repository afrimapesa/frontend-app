# AfrimaPesa Frontend

Next.js (App Router, TypeScript, Tailwind) web app for AfrimaPesa. The API is the Django backend in the sibling repo `../backend app`. Project context lives in `../backend app/docs`.

## Local setup

```bash
npm install
cp .env.example .env.local   # API_URL / NEXT_PUBLIC_API_URL -> http://localhost:8000
npm run dev                  # http://localhost:3000
```

Start the backend first (in `../backend app`): `docker compose up -d` then `python manage.py runserver`.

## Checks

```bash
npm run lint
npm run typecheck   # generates Next route types, then tsc
npm run build
```

CI runs the same on every push and pull request (`.github/workflows/ci.yml`).

## Layout

```
src/app/        routes (App Router)
src/lib/api.ts  typed client for the Django API — keep in sync with backend serializers
```

Note: this Next.js version has Cache Components on. Uncached data fetches must be inside `<Suspense>`; cached ones use `"use cache"` + `cacheLife`. See `node_modules/next/dist/docs/`.
