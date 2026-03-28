# StudyBuddy

A modern study assistant SaaS for students. Ask questions on any subject, build your personal notebook, track progress with analytics, take quizzes, and manage everything from a clean dashboard — with family accounts and parental oversight built in.

## Features

- **Ask anything** — Subject-specific answers with instant explanations across Math, Science, English, History, Computer Science, and more
- **Personal notebook** — Save any answer directly to a searchable notebook, tagged by subject
- **Quizzes** — Practice flashcard-style quizzes generated from your saved notes
- **Analytics dashboard** — Track your daily streak, questions asked, quiz scores, and subject breakdown with charts
- **Parent dashboard** — Family plan accounts give parents a unified view of all children's study activity, streaks, and quiz performance
- **Referral program** — Share a referral link and both you and your friend get 1 week of Pro free on signup
- **Email notifications** — Welcome email on signup, daily study reminders if inactive, weekly progress reports, payment confirmations
- **Stripe subscriptions** — Free, Pro ($9/mo), and Family ($19/mo) plans with Stripe Checkout and Customer Portal
- **Dark mode** — Full dark mode support across every page
- **Mobile responsive** — Works on all screen sizes

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Payments | Stripe Checkout + Webhooks |
| Email | Resend |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Deployment | Vercel |

## Project Structure

```
app/
  (auth)/          # Login, signup, OAuth callback
  (dashboard)/     # All authenticated pages
    ask/           # Main Q&A page
    dashboard/     # Student dashboard
    notebook/      # Saved notes
    analytics/     # Usage analytics
    settings/      # Profile, billing, referrals
    upgrade/       # Pricing / plan selection
    parent/        # Family plan parent overview
  api/
    ask/           # Question answering endpoint
    quiz/          # Quiz generation
    referral/      # Referral code generation and claiming
    stripe/        # Checkout, portal, webhook
    family/        # Family member invite
    email/         # Cron email endpoints
  page.tsx         # Landing page
  not-found.tsx    # 404 page
lib/
  supabase/        # Supabase client helpers + middleware
  email/           # Resend email templates
  types.ts         # Shared TypeScript interfaces
supabase/
  migrations/      # SQL migrations (run in order)
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- A [Resend](https://resend.com) account
- A [Google Cloud](https://console.cloud.google.com) project (for the Generative Language API)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd studybuddy-ai
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

See the [Environment Variables](#environment-variables) section below for all required keys.

### 3. Run Supabase migrations

With the Supabase CLI installed:

```bash
supabase db push
```

Or paste each file in `supabase/migrations/` into the Supabase SQL editor in order:
1. `001_initial_schema.sql`
2. `002_semantic_search.sql`
3. `003_family_and_referrals.sql`

### 4. Configure Stripe products

Create two products in your Stripe dashboard:
- **Pro** — $9/month recurring
- **Family** — $19/month recurring

Then set the price IDs as `STRIPE_PRO_PRICE_ID` and `STRIPE_FAMILY_PRICE_ID` in your env file.

### 5. Set up Stripe webhook

Forward webhooks locally for development:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret printed to your terminal and set it as `STRIPE_WEBHOOK_SECRET`.

In production, add `https://yourdomain.com/api/stripe/webhook` as a webhook endpoint in the Stripe dashboard and listen for the `checkout.session.completed` event.

### 6. Configure Supabase Auth

In your Supabase project settings:
- Enable **Email** and **Google** providers
- Set your site URL to `http://localhost:3000` (dev) / your production URL
- Add `http://localhost:3000/auth/callback` to the redirect URL allowlist

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Generative Language API
GOOGLE_API_KEY=your-google-api-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...

# Resend (email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron security (generate a random string)
CRON_SECRET=your-random-secret-string
```

## Deploying to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Add all environment variables from `.env.local` to the Vercel project settings
4. Deploy

Vercel will automatically pick up `vercel.json` and schedule the cron jobs:
- **Daily reminder emails** — every day at 9:00 AM UTC
- **Weekly report emails** — every Monday at 8:00 AM UTC

The cron endpoints are protected by `CRON_SECRET` and called with `Authorization: Bearer <CRON_SECRET>`.

## Subscription Plans

| Feature | Free | Pro | Family |
|---|---|---|---|
| Questions per day | 5 | Unlimited | Unlimited |
| Notebook entries | Unlimited | Unlimited | Unlimited |
| Quizzes | Unlimited | Unlimited | Unlimited |
| Analytics | Basic | Full | Full |
| Parent dashboard | — | — | Yes (up to 5 members) |
| Price | Free | $9/mo | $19/mo |

## Referral Program

Each user gets a unique 8-character referral code accessible from Settings. When someone signs up using a referral link (`/signup?ref=CODE`), both the referrer and the new user receive 7 days of Pro access — no payment required.

## License

MIT
