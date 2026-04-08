This is a [Next.js](https://nextjs.org) app for StudyBuddy AI.

## Local development

The app is intended to run on your machine at **http://localhost:3000** (not deployed to Vercel by default).

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables and fill in your Supabase values:

   ```bash
   cp .env.example .env.local
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local` so OAuth redirects (e.g. Google sign-in) return to your local app. See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for provider configuration.

### Production-like run locally

```bash
npm run build
npm start
```

The production server also defaults to port **3000** unless you set `PORT`.

## Fonts

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to load [Geist](https://github.com/vercel/geist-font).

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js deployment overview](https://nextjs.org/docs/app/building-your-application/deploying) — if you later deploy elsewhere, configure that host’s URL in `NEXT_PUBLIC_APP_URL` and your OAuth redirect URIs.
