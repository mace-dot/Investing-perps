# Investing Reps

Learn a technique. Test your judgment. Share your reasoning.

This is a mobile-first practice app for people who are new to evaluating businesses. It is not a brokerage, it does not place trades, and it does not rank people by investment returns.

## Demo mode

With no secrets configured, the app runs on sample lessons. Those lessons are marked **needs review**. They are not described as expert-reviewed. Practice feedback comes from the canonical lesson text. Posts, comments, follows, and progress stay in this browser and say so. The sample leaderboard is labeled sample data.

```bash
npm install
npm run dev
```

Open the feed, then Practice, and start “A cheap-looking share can be an expensive business.”

## Database

Use a **new** Supabase project named `investing perps`.

Do not connect this app to the Favos project. If a URL, database string, or project name contains `favos`, the server refuses to open a client.

Live mode turns on only when all of these are set:

- `SUPABASE_PROJECT_NAME=investing perps`
- `NEXT_PUBLIC_SUPABASE_PROJECT_NAME=investing perps`
- `NEXT_PUBLIC_SUPABASE_URL` for that new project
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the anon key variable)

See `.env.example`. Never commit real keys, and never put the service-role key in a `NEXT_PUBLIC_` variable.

### Apply the migration to investing perps only

1. In the Supabase dashboard, open the project named **investing perps**. Confirm it is not Favos.
2. Open the SQL editor.
3. Paste and run `supabase/migrations/20260926120000_investing_perps_init.sql`.
4. In Authentication, enable email sign-in if you want accounts.
5. To make someone a moderator, set `app_metadata.role` to `moderator` for that user in the Auth admin UI. Users cannot grant themselves this role. Do not store roles in `user_metadata`.

Answer keys are in the `private` schema. There is no select policy that exposes them through the Data API. Ranking points are inserted only inside `public.submit_my_attempt`, which ignores any point total from the browser.

The seeded lessons are `needs_review`. The sample weekly challenge is `draft`. Public ranking points stay off until an editor sets a lesson to `reviewed` and publishes a weekly challenge made only of those questions.

## AI

Leave `AI_API_KEY` empty to keep canonical feedback. If you set a key, lesson help and composer suggestions go to the OpenAI-compatible URL in `AI_BASE_URL` (the Vercel AI Gateway by default). The app checks the JSON shape. A timeout, a bad payload, or a missing key falls back to the lesson text and says so. Composer suggestions are never published automatically.

The rate limit in this MVP is in server memory unless you later wire `private.rate_limits`. Memory limits do not span multiple server instances.

## Scripts

```bash
npm test
npm run lint
npm run build
```

## What you still configure

1. Create or open the Supabase project named **investing perps** (not Favos).
2. Run the migration in that project’s SQL editor.
3. Copy `.env.example` to `.env.local` and fill the URL and publishable key.
4. Optionally add `AI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
5. Restart `npm run dev`.

This repository does not deploy itself.

## Limits

- Sample curriculum has not had human editorial review. Do not treat it as expert-reviewed.
- A correct multiple-choice selection is not treated as proof of understanding.
- Demo social actions are local. They are not written to Supabase.
- The app does not fetch arbitrary source URLs.
- Schema validation does not make a financial claim true.
- Global rankings are opt-in and are a learning board only. They cannot prove independent work.
- Confidence is stored for reflection and does not add points.
